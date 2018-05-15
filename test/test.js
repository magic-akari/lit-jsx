import test from "ava";
import litjsx from "../dist/litjsx.umd.js";

const createElement = (name, attributes, ...children) => {
  return { name, attributes, children };
};

const Fragment = Symbol(`Fragment`);

const React = {
  createElement,
  Fragment
};

test(`shoulr parse 123`, t => {
  t.is(litjsx({ React })`123`, `123`);
});

test(`should parse <></>`, t => {
  t.deepEqual(litjsx({ React })`<></>`, {
    name: Fragment,
    attributes: {},
    children: []
  });
});

test(`should parse <>Fragment</>`, t => {
  t.deepEqual(litjsx({ React })`<>Fragment</>`, {
    name: Fragment,
    attributes: {},
    children: [`Fragment`]
  });
});

test(`should parse <tag/>`, t => {
  t.deepEqual(litjsx({ React })`<tag />`, {
    name: `tag`,
    attributes: {},
    children: []
  });
});

test(`should parse <tag><tag/>`, t => {
  t.deepEqual(litjsx({ React })`<tag></tag>`, {
    name: `tag`,
    attributes: {},
    children: []
  });
});

test(`should parse <p>hello,world</p>`, t => {
  t.deepEqual(litjsx({ React })`<p>hello,world</p>`, {
    name: `p`,
    attributes: {},
    children: [`hello,world`]
  });
});

test(`should parse attributes`, t => {
  t.deepEqual(litjsx({ React })`<p className="greeting">hi</p>`, {
    name: `p`,
    attributes: { className: `greeting` },
    children: [`hi`]
  });
});

test(`should parse boolean attributes`, t => {
  t.deepEqual(litjsx({ React })`<button disabled>attack</button>`, {
    name: `button`,
    attributes: { disabled: true },
    children: [`attack`]
  });
});

test(`should parse inject value`, t => {
  t.deepEqual(litjsx({ React })`<p className=${"greeting"}>${"hi"}</p>`, {
    name: `p`,
    attributes: { className: `greeting` },
    children: [`hi`]
  });
});

test(`should parse spread attributes`, t => {
  t.deepEqual(
    litjsx({ React })`<p ...${{ id: "hello", className: "greeting" }}>hi</p>`,
    {
      name: `p`,
      attributes: { id: "hello", className: `greeting` },
      children: [`hi`]
    }
  );
});

test(`should parse mixed attributes`, t => {
  t.deepEqual(
    litjsx({ React })`<p id="hello"  ...${{ className: "greeting" }}>hi</p>`,
    {
      name: `p`,
      attributes: { id: "hello", className: `greeting` },
      children: [`hi`]
    }
  );
});

test(`should override attributes`, t => {
  t.deepEqual(
    litjsx({ React })`<p className="hello"  ...${{
      className: "greeting"
    }}>hi</p>`,
    {
      name: `p`,
      attributes: { className: `greeting` },
      children: [`hi`]
    }
  );

  t.deepEqual(
    litjsx({ React })`<p ...${{
      className: "greeting"
    }}  className=${"hello"}>hi</p>`,
    {
      name: `p`,
      attributes: { className: `hello` },
      children: [`hi`]
    }
  );
});

test(`should parse <a><b/></a>`, t => {
  t.deepEqual(litjsx({ React })`<a><b/></a>`, {
    name: `a`,
    attributes: {},
    children: [
      {
        name: `b`,
        attributes: {},
        children: []
      }
    ]
  });
});

test(`should parse <a id="a"><b className="b" /></a>`, t => {
  t.deepEqual(litjsx({ React })`<a id=${"a"}><b className="b" /></a>`, {
    name: `a`,
    attributes: { id: `a` },
    children: [
      {
        name: `b`,
        attributes: { className: `b` },
        children: []
      }
    ]
  });
});

test(`should parse inject tag`, t => {
  class Header {}
  class Footer {}
  t.deepEqual(
    litjsx({ React })`<><${Header} title=${"test"}/><${Footer} /></>`,
    {
      name: Fragment,
      attributes: {},
      children: [
        {
          name: Header,
          attributes: { title: "test" },
          children: []
        },
        {
          name: Footer,
          attributes: {},
          children: []
        }
      ]
    }
  );
});

test("should parse list", t => {
  const list = Array.from(Array(10000).keys());
  let jsx = litjsx({ React });
  t.deepEqual(
    jsx`<ul>${list.map((l, i) => jsx`<li key=${i}>the ${l} line</li>`)}</ul>`,
    {
      name: `ul`,
      attributes: {},
      children: [
        list.map((l, i) => ({
          name: "li",
          attributes: { key: i },
          children: ["the", l, "line"]
        }))
      ]
    }
  );
});

test("parse a 10000 tags templete", t => {
  let tempelete = "<>";
  let result = {
    name: Fragment,
    attributes: {},
    children: []
  };
  for (let i = 0; i < 10000; i++) {
    if (Math.random() > 0.33) {
      tempelete += "<tag/>";
      result.children.push({ name: "tag", attributes: {}, children: [] });
    } else if (Math.random() > 0.5) {
      tempelete += "<tag>only text here</tag>";
      result.children.push({
        name: "tag",
        attributes: {},
        children: ["only text here"]
      });
    } else {
      tempelete += `<tag a="123" b='456' ok/>`;
      result.children.push({
        name: "tag",
        attributes: { a: "123", b: "456", ok: true },
        children: []
      });
    }
  }
  tempelete += "</>";
  t.deepEqual(litjsx({ React })([tempelete], []), result);
});

test(`throw`, t => {
  const jsx = litjsx({ React });
  t.throws(() => jsx`<`);
  t.throws(() => jsx`>`);
  t.throws(() => jsx`<>`);
  t.throws(() => jsx`< >`);
  t.throws(() => jsx`</>`);
  t.throws(() => jsx`<p>`);
  t.throws(() => jsx`<p></q>`);
  t.throws(() => jsx`<p></>`);
  t.throws(() => jsx`<p><q></p>`);
  t.throws(() => jsx`<tag className=></tag>`);
  t.throws(() => jsx`<tag ... ></tag>`);
  t.throws(() => jsx`<tag ...className></tag>`);
  t.throws(() => jsx`<tag ${"className"}="tag"></tag>`);
});
