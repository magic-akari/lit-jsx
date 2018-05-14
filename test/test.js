import test from "ava";
import litjsx from "../dist/litjsx.umd.js";

const createElement = (name, attrbutes, ...children) => {
  return { name, attrbutes, children };
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
    attrbutes: {},
    children: []
  });
});

test(`should parse <>Fragment</>`, t => {
  t.deepEqual(litjsx({ React })`<>Fragment</>`, {
    name: Fragment,
    attrbutes: {},
    children: [`Fragment`]
  });
});

test(`should parse <tag/>`, t => {
  t.deepEqual(litjsx({ React })`<tag />`, {
    name: `tag`,
    attrbutes: {},
    children: []
  });
});

test(`should parse <tag><tag/>`, t => {
  t.deepEqual(litjsx({ React })`<tag></tag>`, {
    name: `tag`,
    attrbutes: {},
    children: []
  });
});

test(`should parse <p>hello,world</p>`, t => {
  t.deepEqual(litjsx({ React })`<p>hello,world</p>`, {
    name: `p`,
    attrbutes: {},
    children: [`hello,world`]
  });
});

test(`should parse attrbutes`, t => {
  t.deepEqual(litjsx({ React })`<p className="greeting">hi</p>`, {
    name: `p`,
    attrbutes: { className: `greeting` },
    children: [`hi`]
  });
});

test(`should parse inject value`, t => {
  t.deepEqual(litjsx({ React })`<p className=${"greeting"}>${"hi"}</p>`, {
    name: `p`,
    attrbutes: { className: `greeting` },
    children: [`hi`]
  });
});

test(`should parse spread attrbutes`, t => {
  t.deepEqual(
    litjsx({ React })`<p ...${{ id: "hello", className: "greeting" }}>hi</p>`,
    {
      name: `p`,
      attrbutes: { id: "hello", className: `greeting` },
      children: [`hi`]
    }
  );
});

test(`should parse mixed attrbutes`, t => {
  t.deepEqual(
    litjsx({ React })`<p id="hello"  ...${{ className: "greeting" }}>hi</p>`,
    {
      name: `p`,
      attrbutes: { id: "hello", className: `greeting` },
      children: [`hi`]
    }
  );
});

test(`should override attrbutes`, t => {
  t.deepEqual(
    litjsx({ React })`<p className="hello"  ...${{
      className: "greeting"
    }}>hi</p>`,
    {
      name: `p`,
      attrbutes: { className: `greeting` },
      children: [`hi`]
    }
  );

  t.deepEqual(
    litjsx({ React })`<p ...${{
      className: "greeting"
    }}  className=${"hello"}>hi</p>`,
    {
      name: `p`,
      attrbutes: { className: `hello` },
      children: [`hi`]
    }
  );
});

test(`should parse <a><b/></a>`, t => {
  t.deepEqual(litjsx({ React })`<a><b/></a>`, {
    name: `a`,
    attrbutes: {},
    children: [
      {
        name: `b`,
        attrbutes: {},
        children: []
      }
    ]
  });
});

test(`should parse <a id="a"><b className="b" /></a>`, t => {
  t.deepEqual(litjsx({ React })`<a id=${"a"}><b className="b" /></a>`, {
    name: `a`,
    attrbutes: { id: `a` },
    children: [
      {
        name: `b`,
        attrbutes: { className: `b` },
        children: []
      }
    ]
  });
});

test(`should parse inject tag`, t => {
  class Header {}
  class Footer {}
  t.deepEqual(litjsx({ React })`<><${Header} title=${"test"}/><${Footer} /></>`, {
    name: Fragment,
    attrbutes: {},
    children: [
      {
        name: Header,
        attrbutes: { title: "test" },
        children: []
      },
      {
        name: Footer,
        attrbutes: {},
        children: []
      }
    ]
  });
});

test("should parse list", t => {
  const list = Array.from(Array(10000).keys());
  let jsx = litjsx({ React });
  t.deepEqual(
    jsx`<ul>${list.map((l, i) => jsx`<li key=${i}>the ${l} line</li>`)}</ul>`,
    {
      name: `ul`,
      attrbutes: {},
      children: [
        list.map((l, i) => ({
          name: "li",
          attrbutes: { key: i },
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
    attrbutes: {},
    children: []
  };
  for (let i = 0; i < 10000; i++) {
    if (Math.random() > 0.33) {
      tempelete += "<tag/>";
      result.children.push({ name: "tag", attrbutes: {}, children: [] });
    } else if (Math.random() > 0.5) {
      tempelete += "<tag>only text here</tag>";
      result.children.push({
        name: "tag",
        attrbutes: {},
        children: ["only text here"]
      });
    } else {
      tempelete += `<tag a="123" b='456' />`;
      result.children.push({
        name: "tag",
        attrbutes: { a: "123", b: "456" },
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
  t.throws(() => jsx`<tag className></tag>`);
  t.throws(() => jsx`<tag className=></tag>`);
  t.throws(() => jsx`<tag ... ></tag>`);
  t.throws(() => jsx`<tag ...className></tag>`);
  t.throws(() => jsx`<tag ${"className"}="tag"></tag>`);
});
