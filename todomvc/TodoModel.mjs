const store = (namespace, data) => {
  if (data) {
    return localStorage.setItem(namespace, JSON.stringify(data));
  }
  const store = localStorage.getItem(namespace);
  return (store && JSON.parse(store)) || [];
};

export class TodoModel {
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
