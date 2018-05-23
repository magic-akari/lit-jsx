import { TodoApp } from "./TodoApp.mjs";
import { TodoModel } from "./TodoModel.mjs";

ReactDOM.render(
  jsx`<${TodoApp} model=${new TodoModel("lit-jsx-todos")} />`,
  document.querySelector(".todoapp"),
);
