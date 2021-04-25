import createNamedContext from "./createNameContext";

// 创建名为 Router-History 的 context
// 单一原则，一个文件，完成一种类型函数功能

const historyContext = /*#__PURE__*/ createNamedContext("Router-History");
export default historyContext;