export const Footer = props => jsx`
<footer className="footer" key="Footer">
  <span className="todo-count">
    <strong>${props.activeTodoCount}</strong>${" "}
  ${props.activeTodoCount === 1 ? "item" : "items"}${" "}left
  </span>
    <ul className="filters">
      <li>
        <a href="#/" className=${
          props.nowShowing === "all" /* ACTIVE_TODOS */ ? "selected" : undefined
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
</footer>
`;
