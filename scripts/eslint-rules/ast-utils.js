export const COMPONENT_BASE_CLASSES = ["Component", "BasePage"];

/**
 * Checks if a class declaration extends one of our component base classes.
 * @param {ASTNode} node
 * @returns {boolean}
 */
export const isComponentClass = (node) =>
  node.superClass && COMPONENT_BASE_CLASSES.includes(node.superClass.name);

/**
 * Finds the constructor method definition in a class body.
 * @param {ASTNode} node
 * @returns {ASTNode|undefined}
 */
export const findConstructor = (node) =>
  node.body.body.find((m) => m.type === "MethodDefinition" && m.kind === "constructor");

/**
 * Finds the super() call in a constructor body.
 * @param {ASTNode} constructorNode
 * @returns {ASTNode|undefined}
 */
export const findSuperCall = (constructorNode) => {
  if (!constructorNode?.value?.body?.body) return undefined;
  return constructorNode.value.body.body.find(
    (s) =>
      s.type === "ExpressionStatement" &&
      s.expression.type === "CallExpression" &&
      s.expression.callee.type === "Super",
  );
};

/**
 * Converts a snake_case string to PascalCase.
 * @param {string} str
 * @returns {string}
 */
export const toPascalCase = (str) =>
  str
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/**
 * Checks if a method name follows the getFoo/setFoo pattern.
 * @param {string} name
 * @returns {boolean}
 */
export const isGetterSetterName = (name) =>
  (name.startsWith("set") || name.startsWith("get")) &&
  name.length > 3 &&
  name[3] === name[3].toUpperCase();

/**
 * Creates a visitor that tracks whether we are inside a component class.
 * @param {Object} visitors - Rule visitors
 * @returns {Object}
 */
export const createComponentVisitor = (visitors) => {
  let inComponent = false;

  const componentVisitors = {
    ClassDeclaration(node) {
      if (isComponentClass(node)) inComponent = true;
      if (visitors.ClassDeclaration) visitors.ClassDeclaration(node);
    },
    "ClassDeclaration:exit"(node) {
      if (visitors["ClassDeclaration:exit"]) visitors["ClassDeclaration:exit"](node);
      inComponent = false;
    },
  };

  // Wrap other visitors to check inComponent
  Object.keys(visitors).forEach((key) => {
    if (key !== "ClassDeclaration" && key !== "ClassDeclaration:exit") {
      componentVisitors[key] = (node) => {
        if (inComponent) {
          visitors[key](node);
        }
      };
    }
  });

  return componentVisitors;
};

/**
 * Checks if a method or constructor contains a call to a specific method.
 * Defaults to checking calls on 'this' (e.g., this.render()).
 * @param {ASTNode} containerNode
 * @param {string} methodName
 * @param {string} objectName
 * @returns {boolean}
 */
export const hasCallTo = (containerNode, methodName, objectName = "this") => {
  if (!containerNode?.value?.body?.body) return false;

  const statements = containerNode.value.body.body;

  // Handle super() specifically
  if (methodName === "super") {
    return statements.some(
      (s) =>
        s.type === "ExpressionStatement" &&
        s.expression.type === "CallExpression" &&
        s.expression.callee.type === "Super",
    );
  }

  return statements.some((s) => {
    if (
      s.type === "ExpressionStatement" &&
      s.expression.type === "CallExpression" &&
      s.expression.callee.type === "MemberExpression"
    ) {
      const { object, property } = s.expression.callee;
      const isCorrectObject =
        objectName === "this" ? object.type === "ThisExpression" : object.name === objectName;
      return isCorrectObject && property.name === methodName;
    }
    return false;
  });
};
