const $FRAGMENT = Symbol("fragment");
const $STRING_EMPTY = "";

type PlaceHolder = () => number;
type Token = string | PlaceHolder;

const isPlaceHolder = (x: any): x is PlaceHolder => {
  return typeof x === "function";
};

const tokenizer = (strings: TemplateStringsArray): Token[] => {
  const length = strings.length;

  let inBrace = false;
  const result: Token[] = [];

  for (let index = 0; index < length; ++index) {
    const str = strings[index];
    const block = str
      .split(/((?:<|^)[^<>]*?(?:>|$))/)
      .filter((s) => s.trim() !== $STRING_EMPTY);

    for (const iterator of block) {
      if (iterator[0] === "<" || inBrace) {
        const tokens = iterator
          .split(/(<\/?>|<\/?|\/?>|\.{3}|'.*?'|".*?"|\s+)/)
          .filter((s) => s.trim() !== $STRING_EMPTY);

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

type JSXElementName = Token | typeof $FRAGMENT;
type JSXAttributes = Array<{ [x: string]: any } | PlaceHolder>;

interface IAST {
  jsxElementName: JSXElementName;
  jsxAttributes: JSXAttributes;
  jsxChildren: JSXElement[];
}
type JSXElement = IAST | Token;

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
    let jsxElementName: JSXElementName = $FRAGMENT;
    let jsxAttributes: JSXAttributes = [];
    const jsxChildren: JSXElement[] = [];

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
              `unexpected token: ${rightTagName} tag not matched ${jsxElementName}`,
            );
          }
          skip(2);
        } else {
          throw new SyntaxError(
            `unexpected token near: ${rightTag} , ${rightTagName} and ${rightClosingTag}`,
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
    const jsxAttributes = [];

    while (peak() !== ">" && peak() !== "/>") {
      let attributeName = next();
      let attributeValue: Token | boolean = peak();

      if (typeof attributeName !== "string") {
        throw new SyntaxError(
          `unexpected inserted token: ${attributeName}, attributeName must be literals`,
        );
      }

      if (attributeName === "...") {
        if (typeof attributeValue === "string") {
          throw new SyntaxError(
            `unexpected token: ${attributeValue} after: ${attributeName}`,
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
              `attributeValue must be quoted: ${attributeValue}`,
            );
          }
        }

        jsxAttributes.push({ [attributeName]: attributeValue });
      } else {
        throw new SyntaxError(
          `unexpected token: ${attributeName} after: ${peak(-2)}`,
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
    return (h: any, fragment: any, values: any[]) => ast;
  }

  if (isPlaceHolder(ast)) {
    return (h: any, fragment: any, values: any[]) => values[ast()];
  }

  const { jsxElementName, jsxAttributes, jsxChildren } = ast as IAST;
  const children = jsxChildren.map((c) => transpiler(c));

  return (h: any, fragment: any, values: any[]): any => {
    let name = jsxElementName;
    if (name === $FRAGMENT) {
      name = fragment;
    } else if (isPlaceHolder(name)) {
      name = values[name()];
    }
    const attributes = jsxAttributes.reduce((p, c) => {
      if (isPlaceHolder(c)) {
        c = values[c()];
      } else {
        const key = Object.keys(c)[0];
        let value = c[key];
        if (isPlaceHolder(value)) {
          value = values[value()];
          c = { [key]: value };
        }
      }

      return { ...p, ...c };
    }, {});

    return h(name, attributes, ...children.map((c) => c(h, fragment, values)));
  };
};

const cache = new WeakMap();

const litjsx = ({
  React,
  pragma,
  pragmaFrag,
}: {
  React?: any;
  pragma?: any;
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
