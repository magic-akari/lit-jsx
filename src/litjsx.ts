const $fragment = Symbol("fragment");
const $string_empty = "";

type PlaceHolder = () => number;
type Token = string | PlaceHolder;

const isPlaceHolder = (x: any): x is PlaceHolder => {
  return typeof x === "function";
};

const tokenizer = (strings: TemplateStringsArray): Token[] => {
  const length = strings.length;

  let inBrace = false;
  let result: Token[] = [];

  for (let index = 0; index < length; ++index) {
    const string = strings[index];
    const block = string
      .split(/((?:<|^)[^<>]*?(?:>|$))/)
      .filter(s => s.trim() !== $string_empty);

    for (const iterator of block) {
      if (iterator[0] === "<" || inBrace) {
        let tokens = iterator
          .split(/(<\/?>|<\/?|\/?>|\.{3}|'.*?'|".*?"|\s+)/)
          .filter(s => s.trim() !== $string_empty);

        inBrace = !/>$/.test(tokens[tokens.length - 1]);
        while (tokens[0] !== undefined) {
          result.push(tokens.shift() as Token);
        }
      } else {
        result.push(iterator.trim());
      }
    }

    result.push(() => index);
  }

  result.pop();

  return result;
};

type JSXElementName = Token | typeof $fragment;
type JSXAttributes = ({ [key in keyof any]: any } | PlaceHolder)[];

type AST = {
  jsxElementName: JSXElementName;
  jsxAttributes: JSXAttributes;
  jsxChildren: JSXElement[];
};
type JSXElement = AST | Token;

const parser = (tokens: Token[]) => {
  let index = 0;

  const peak = (offset = 0) => {
    return tokens[index + offset];
  };

  const next = (): Token => {
    return tokens[index++];
  };

  const skip = (offset = 1) => {
    index += offset;
  };

  const getElement = (token: Token): JSXElement => {
    let jsxElementName: JSXElementName = $fragment;
    let jsxAttributes: JSXAttributes = [];
    let jsxChildren: JSXElement[] = [];

    if (token === "<>") {
      while (peak() !== "</>") {
        if (peak() === undefined) {
          throw new SyntaxError("unexpected EOF");
        }
        jsxChildren.push(getElement(next()));
      }
      skip();

      return { jsxElementName, jsxAttributes, jsxChildren };
    } else if (token === "<") {
      jsxElementName = next();
      jsxAttributes = getAttributes();

      const leftClosingTag = next();

      if (leftClosingTag === ">") {
        while (!(peak() === "</>" || (peak() === "</" && peak(2) === ">"))) {
          if (peak() === undefined) {
            throw new SyntaxError("unexpected EOF");
          }
          jsxChildren.push(getElement(next()));
        }

        const rightTag = next();
        const rightTagName = peak();
        const rightClosingTag = peak(1);

        if (rightTag === "</>" && isPlaceHolder(jsxElementName)) {
          // ok
        } else if (rightTag === "</" && rightClosingTag === ">") {
          if (
            !isPlaceHolder(jsxElementName) &&
            jsxElementName === rightTagName
          ) {
            // ok
          } else if (
            isPlaceHolder(jsxElementName) &&
            typeof isPlaceHolder(rightTagName)
          ) {
            // ok
          } else {
            throw new SyntaxError(
              `unexpected token: ${rightTagName} tag not matched ${jsxElementName}`
            );
          }
          skip(2);
        } else {
          throw new SyntaxError(
            `unexpected token near: ${rightTag} , ${rightTagName} and ${rightClosingTag}`
          );
        }
      }

      return { jsxElementName, jsxAttributes, jsxChildren };
    } else if (token === ">" || token === "/>" || token === "</>") {
      throw new SyntaxError(`unexpected token: ${token} after: ${peak(-1)}`);
    } else {
      return token;
    }
  };

  const getAttributes = (): JSXAttributes => {
    let jsxAttributes = [];

    while (peak() !== ">" && peak() !== "/>") {
      let attributeName = next();
      let attributeValue: Token | boolean = peak();

      if (typeof attributeName !== "string") {
        throw new SyntaxError(
          `unexpected inserted token: ${attributeName}, attributeName must be literals`
        );
      }

      if (attributeName === "...") {
        if (typeof attributeValue === "string") {
          throw new SyntaxError(
            `unexpected token: ${attributeValue} after: ${attributeName}`
          );
        }
        jsxAttributes.push(attributeValue);
        skip();
      } else if (/^[\_\$\w][\_\$\w\d]*\=?$/.test(attributeName)) {
        if (attributeName[attributeName.length - 1] === "=") {
          attributeName = attributeName.slice(0, -1);
          skip();
        } else {
          attributeValue = true;
        }

        if (typeof attributeValue === "string") {
          if (/^(['"]).*\1$/.test(attributeValue)) {
            attributeValue = attributeValue.slice(1, -1);
          } else {
            throw new SyntaxError(
              `attributeValue must be quoted: ${attributeValue}`
            );
          }
        }

        jsxAttributes.push({ [attributeName]: attributeValue });
      } else {
        throw new SyntaxError(
          `unexpected token: ${attributeName} after: ${peak(-2)}`
        );
      }
    }
    return jsxAttributes;
  };

  const result = getElement(next());

  if (index !== tokens.length) {
    throw new SyntaxError(`unexpected token: ${peak()} after: ${peak(-1)}`);
  }

  return result;
};

const transpiler = (ast: JSXElement) => {
  if (typeof ast === "string") {
    return (h: Function, fragment: any, values: any[]) => ast;
  }

  if (isPlaceHolder(ast)) {
    return (h: Function, fragment: any, values: any[]) => values[ast()];
  }

  const { jsxElementName, jsxAttributes, jsxChildren } = ast as AST;
  const children = jsxChildren.map(c => transpiler(c));

  return (h: Function, fragment: any, values: any[]): any => {
    let name = jsxElementName;
    if (name === $fragment) {
      name = fragment;
    } else if (isPlaceHolder(name)) {
      name = values[name()];
    }
    let attributes = jsxAttributes.reduce((p, c) => {
      if (isPlaceHolder(c)) {
        c = values[c()];
      } else {
        let key = Object.keys(c)[0];
        let value = c[key];
        if (isPlaceHolder(value)) {
          value = values[value()];
          c = { [key]: value };
        }
      }

      return { ...p, ...c };
    }, {});

    return h(name, attributes, ...children.map(c => c(h, fragment, values)));
  };
};

const cache = new WeakMap();

const litjsx = ({
  React,
  pragma,
  pragmaFrag
}: {
  React?: any;
  pragma?: Function;
  pragmaFrag?: any;
}) => {
  let h =
    pragma ||
    (() => {
      throw new Error("pragma required");
    });
  let fragment = pragmaFrag || new Error("pragmaFrag required");

  if (React !== undefined) {
    h = React.createElement;
    fragment = React.Fragment;
  }
  return (strings: TemplateStringsArray, ...values: any[]) => {
    if (cache.has(strings)) {
      return cache.get(strings)(h, fragment, values);
    } else {
      const tokens = tokenizer(strings);
      const ast = parser(tokens);
      const result = transpiler(ast);
      cache.set(strings, result);
      return result(h, fragment, values);
    }
  };
};

export default litjsx;
