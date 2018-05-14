# lit-jsx &middot; [![Build Status](https://travis-ci.org/hufan-akari/lit-jsx.svg?branch=master)](https://travis-ci.org/hufan-akari/lit-jsx)

A runtime jsx parser.
Write your jsx with tagged template literals.

[lit-jsx TodoMVC Demo](https://hufan-akari.github.io/lit-jsx/examples/)

## Example

### HelloMessage

```js
const jsx = litjsx({ React });

class HelloMessage extends React.Component {
  render() {
    return jsx`
      <div>
        Hello ${this.props.name}
      </div>
    `;
  }
}

ReactDOM.render(jsx`<${HelloMessage} name="Taylor" />`, mountNode);
```

### Timer

```js
const jsx = litjsx({ React });

class TodoApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: "" };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return jsx`
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
      id: Date.now()
    };
    this.setState(prevState => ({
      items: prevState.items.concat(newItem),
      text: ""
    }));
  }
}

class TodoList extends React.Component {
  render() {
    return jsx`
      <ul>
        ${this.props.items.map(
          item => jsx`<li key=${item.id}>${item.text}</li>`
        )}
      </ul>
    `;
  }
}
```
