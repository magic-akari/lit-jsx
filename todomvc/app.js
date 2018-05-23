"use strict";

class TodoApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nowShowing: "all" /* ALL_TODOS */,
    };
    this.add = event => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      const input = event.target;
      const value = input.value.trim();
      if (value.length > 0) {
        this.props.model.addTodo(value);
        input.value = "";
      }
    };
    this.toggleAll = event => {
      const checked = event.target.checked;
      this.props.model.toggleAll(checked);
    };
    this.toggle = todoToToggle => {
      this.props.model.toggle(todoToToggle);
    };
    this.destroy = todo => {
      this.props.model.destroy(todo);
    };
    this.edit = todo => {
      this.setState({ editing: todo.id });
    };
    this.save = (todoToSave, text) => {
      this.props.model.save(todoToSave, text);
      this.setState({ editing: undefined });
    };
    this.cancel = () => {
      this.setState({ editing: undefined });
    };
    this.clearCompleted = () => {
      this.props.model.clearCompleted();
    };
    this.props.model.subscribe(this.setState.bind(this, {}));
  }
  componentDidMount() {
    window.addEventListener(
      "hashchange",
      () => {
        switch (location.hash) {
          case "#/active":
            this.setState({ nowShowing: "active" /* ACTIVE_TODOS */ });
            break;
          case "#/completed":
            this.setState({ nowShowing: "completed" /* COMPLETED_TODOS */ });
            break;
          case "#/":
          default:
            this.setState({ nowShowing: "all" /* ALL_TODOS */ });
            break;
        }
      },
      { passive: true },
    );
  }
  get shownTodos() {
    return this.props.model.todos.filter(todo => {
      switch (this.state.nowShowing) {
        case "active" /* ACTIVE_TODOS */:
          return !todo.completed;
        case "completed" /* COMPLETED_TODOS */:
          return todo.completed;
        default:
          return true;
      }
    });
  }
  get TodoList() {
    return jsx`
<ul className="todo-list">
    ${this.shownTodos.map(
      todo =>
        jsx`
        <${TodoItem}
          key=${todo.id}
          todo=${todo}
          editing=${this.state.editing == todo.id}
          onToggle=${this.toggle.bind(this, todo)}
          onDestroy=${this.destroy.bind(this, todo)}
          onEdit=${this.edit.bind(this, todo)}
          onSave=${this.save.bind(this, todo)}
          onCancel=${this.cancel}
        />`,
    )}
</ul>
`;
  }
  get Main() {
    return jsx`
<section className="main" key="Main">
    <input
      id="toggle-all"
      className="toggle-all"
      type="checkbox"
      checked=${this.activeTodoCount === 0}
      onChange=${this.toggleAll}
    />
    <label htmlFor="toggle-all">Mark all as complete</label>
    ${this.TodoList}
</section>
        `;
  }
  get activeTodoCount() {
    return this.props.model.todos.reduce(function(accum, todo) {
      return todo.completed ? accum : accum + 1;
    }, 0);
  }
  get hasCompCompleted() {
    return this.props.model.todos.some(todo => todo.completed);
  }
  render() {
    return jsx`
<>
    <${Header} key="Header" onAddTodo=${this.add} />
    ${
      this.props.model.todos.length > 0
        ? jsx`<>
        ${this.Main}
        ${Footer({
          activeTodoCount: this.activeTodoCount,
          hasCompCompleted: this.hasCompCompleted,
          onClearCompleted: this.clearCompleted,
          nowShowing: this.state.nowShowing,
        })}
    </>`
        : false
    }
</>
`;
  }
}

const Header = props =>
  jsx`
<header className="header">
  <h1>TodoMVC</h1>
  <input
    name="new-todo"
    className="new-todo"
    placeholder="What needs to be done?"
    onKeyDown=${props.onAddTodo}
    autoFocus
  />
</header>`;

const Footer = props => jsx`
<footer className="footer" key="Footer">
  <span className="todo-count">
    <strong>${props.activeTodoCount}</strong>${" "}
  ${props.activeTodoCount === 1 ? "item" : "items"}${" "}left
  </span>
    <ul className="filters">
      <li>
          <a href="#/" className=${
            props.nowShowing === "all" /* ACTIVE_TODOS */
              ? "selected"
              : undefined
          }>All</a>
      </li>

      <li>
          <a href="#/active" className=${
            props.nowShowing === "active" /* ACTIVE_TODOS */
              ? "selected"
              : undefined
          }>Active</a>
      </li>

      <li>
          <a href="#/completed" className=${
            props.nowShowing === "completed" /* COMPLETED_TODOS */
              ? "selected"
              : undefined
          }>Completed</a>
      </li>
    </ul>
    ${
      props.hasCompCompleted
        ? jsx`
    <button 
        className="clear-completed" 
        onClick=${props.onClearCompleted}>
        Clear completed
    </button>
    `
        : false
    }
</footer>`;

const classNames = args => {
  return (
    Object.entries(args)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(" ") || undefined
  );
};

class TodoItem extends React.PureComponent {
  constructor() {
    super(...arguments);
    this.handleSubmit = event => {
      const val = event.target.value;
      if (val.length !== 0) {
        this.props.onSave(val);
      } else {
        this.props.onDestroy();
      }
    };
    this.handleKeyDown = event => {
      switch (event.key) {
        case "Escape" /* ESCAPE_KEY */:
          event.target.value = this.props.todo.title;
          this.props.onCancel(event);
          break;
        case "Enter" /* ENTER_KEY */:
          this.handleSubmit(event);
          break;
        default:
          break;
      }
    };
  }
  render() {
    return jsx`
<li
    className=${classNames({
      completed: this.props.todo.completed,
      editing: this.props.editing,
    })}
>
    <div className="view">
    <input
      className="toggle"
      type="checkbox"
      checked=${this.props.todo.completed}
      onChange=${this.props.onToggle}
    />
    <label onDoubleClick=${this.props.onEdit}>
        ${this.props.todo.title}
    </label>
    <button className="destroy" onClick=${this.props.onDestroy} />
    </div>
    ${
      this.props.editing
        ? jsx`
    <input
      className="edit"
      defaultValue=${this.props.todo.title}
      onBlur=${this.handleSubmit}
      onKeyDown=${this.handleKeyDown}
      autoFocus
    />`
        : false
    }
</li>
`;
  }
}

const store = (namespace, data) => {
  if (data) {
    return localStorage.setItem(namespace, JSON.stringify(data));
  }
  const store = localStorage.getItem(namespace);
  return (store && JSON.parse(store)) || [];
};

class TodoModel {
  constructor(key) {
    this.key = key;
    this.todos = store(key);
    this.onChanges = [];
  }
  subscribe(onChange) {
    this.onChanges.push(onChange);
  }
  inform() {
    store(this.key, this.todos);
    this.onChanges.forEach(cb => {
      cb();
    });
  }
  addTodo(title) {
    this.todos = [
      ...this.todos,
      {
        id: Date.now(),
        title: title,
        completed: false,
      },
    ];
    this.inform();
  }
  toggleAll(checked) {
    this.todos = this.todos.map(todo => {
      return { ...todo, completed: checked };
    });
    this.inform();
  }
  toggle(todoToToggle) {
    this.todos = this.todos.map(todo => {
      return todo !== todoToToggle
        ? todo
        : { ...todo, completed: !todo.completed };
    });
    this.inform();
  }
  destroy(todo) {
    this.todos = this.todos.filter(candidate => candidate !== todo);
    this.inform();
  }
  save(todoToSave, text) {
    this.todos = this.todos.map(todo => {
      return todo !== todoToSave ? todo : { ...todo, title: text };
    });
    this.inform();
  }
  clearCompleted() {
    this.todos = this.todos.filter(todo => !todo.completed);
    this.inform();
  }
}

ReactDOM.render(
  jsx`<${TodoApp} model=${new TodoModel("lit-jsx-todos")} />`,
  document.querySelector(".todoapp"),
);
