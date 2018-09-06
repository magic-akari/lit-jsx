# lit-jsx &middot; [![Build Status](https://travis-ci.org/magic-akari/lit-jsx.svg?branch=master)](https://travis-ci.org/magic-akari/lit-jsx)

A 3kb runtime jsx parser.
Write your jsx with tagged template literals.

lit-jsx is inspired by [lit-html](https://github.com/Polymer/lit-html) and [styled-components](https://github.com/styled-components/styled-components).

## Demo

[lit-jsx + React: TodoMVC](https://magic-akari.github.io/lit-jsx/todomvc/)

## Syntax

The syntax of lit-jsx is similar to JSX. Here are differences.

* You should use `${}` to pass value rather than `{}`.
* Component should pass in `${}`.
* you should use `...${obj}` to pass spread attributes rather than `{...obj}`.
* if closing tag is passed by `${}`, it will be ignored. `</${tag}>` is sames as `</>`.

## Example

### HelloMessage

```jsx
// jsx
class HelloMessage extends React.Component {
  render() {
    return <div>Hello,{this.props.name}</div>;
  }
}

ReactDOM.render(<HelloMessage name="Taylor" />, mountNode);
```

```js
// lit-jsx
const jsx = litjsx({ React });

class HelloMessage extends React.Component {
  render() {
    return jsx`<div>Hello,${this.props.name}</div>`;
  }
}

ReactDOM.render(jsx`<${HelloMessage} name="Taylor" />`, mountNode);
```

### Timer

```js
// some editor will recognise html tag function and highlight the code.
const html = litjsx({ React });

class TodoApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: "" };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return html`
      <div>
        <h3>TODO</h3>
        <${TodoList} items=${this.state.items} />
        <form onSubmit=${this.handleSubmit}>
          <label htmlFor="new-todo">
            What needs to be done?
          </label>
          <input
            id="new-todo"
            onChange=${this.handleChange}
            value=${this.state.text}
          />
          <button>
            Add #${this.state.items.length + 1}
          </button>
        </form>
      </div>
    `;
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (!this.state.text.length) {
      return;
    }
    const newItem = {
      text: this.state.text,
      id: Date.now(),
    };
    this.setState(prevState => ({
      items: prevState.items.concat(newItem),
      text: "",
    }));
  }
}

class TodoList extends React.Component {
  render() {
    return html`
      <ul>
        ${this.props.items.map(
          item => html`<li key=${item.id}>${item.text}</li>`,
        )}
      </ul>
    `;
  }
}
```
