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
  node.body.body.find(
    (m) => m.type === "MethodDefinition" && m.kind === "constructor",
  );

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
        objectName === "this"
          ? object.type === "ThisExpression"
          : object.name === objectName;
      return isCorrectObject && property.name === methodName;
    }
    return false;
  });
};
