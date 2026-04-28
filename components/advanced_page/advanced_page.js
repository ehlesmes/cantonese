import { Component } from "../shared/component.js";
import { Routes } from "../shared/routes.js";

export class AdvancedPage extends Component {
  constructor() {
    super(import.meta.url);
    this.render();
  }

  render() {
    this._container = this.html("div", { className: "advanced-container" });
    this._container.appendChild(
      this.html("h1", { textContent: "Advanced Settings" }),
    );

    Object.keys(localStorage).forEach((key) => {
      const value = localStorage.getItem(key);
      const row = this.html("div", { className: "storage-item" });

      const label = this.html("span", { textContent: key });
      const input = this.html("input", { value });
      const saveBtn = this.html("button", { textContent: "Save" });

      saveBtn.onclick = () => {
        localStorage.setItem(key, input.value);
        alert(`Updated ${key}`);
      };

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(saveBtn);
      this._container.appendChild(row);
    });

    this.shadowRoot.appendChild(this._container);
  }
}

Routes.register(Routes.ADVANCED, AdvancedPage);
