import { Footer } from "./Footer.mjs";
import { Header } from "./Header.mjs";
import { TodoItem } from "./TodoItem.mjs";

export class TodoApp extends React.Component {
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
      ? jsx`
  <>
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
