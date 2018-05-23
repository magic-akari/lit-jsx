export const Header = props =>
  jsx`
<header className="header">
  <h1>TodoMVC</h1>
  <input
  name="new-todo"
  className="new-todo"
  placeholder="What needs to be done?"
  onKeyDown=${props.onAddTodo}
  autoFocus=${true}
  />
</header>
`;
