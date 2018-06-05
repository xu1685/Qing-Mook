/* 获取 URL 中的某一特定的查询字符串的值 */
const getQueryString = (search, name) => {
  const reg = new RegExp(`(\\?|&)${name}=([^&]+)(&|$)`)  // eslint-disable-line
  /* match 方法，如果正则表达式中不存在全局标志，那么如果没有匹配到字符串就返回 null，如果 */
  /* 匹配到字符串，则返回数组，数组中的第一个值是匹配的字符串，从第二个值开始，每个值是匹配正 */
  /* 则表达式中的每个分组的字符串，另外返回的数组还存在两个属性，一个是 index，表示匹配字符 */
  /* 串在原字符串中的起始位置，另一个是 input，表示对原字符串的引用 */
  /* 如果正则表达式中存在全局标志，那么如果没有匹配到字符串就返回 null，如果匹配到字符串就返 */
  /* 回数组，数组中的每一个值都是匹配到的字符串，但是不存在分组信息 */
  const result = search.match(reg)
  if (result !== null) {
    return result[2]
  }
  return null
}

/* eslint-disable */
export {
  getQueryString,
}
/* eslint-disable */
