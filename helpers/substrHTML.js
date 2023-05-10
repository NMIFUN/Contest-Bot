module.exports = function substrHTML(string, length) {
  let m
  const r = /<([^>\s]*)[^>]*>/g
  const stack = []
  let lasti = 0
  let result = ''

  while ((m = r.exec(string)) && length) {
    const temp = string.substring(lasti, m.index).substr(0, length)
    result += temp
    length -= temp.length
    lasti = r.lastIndex

    if (length) {
      result += m[0]
      if (m[1].indexOf('/') === 0) stack.pop()
      else if (m[1].lastIndexOf('/') !== m[1].length - 1) stack.push(m[1])
    }
  }

  result += string.substr(lasti, length)

  while (stack.length) {
    result += '</' + stack.pop() + '>'
  }

  return result
}
