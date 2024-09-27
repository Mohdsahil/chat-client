const Reset = '\x1b[0m';
const FgYellow = '\x1b[33m';

const APP_ENV = 'local'
let APP_HOST = process.env.REACT_APP_APP_HOST


console.log(FgYellow, APP_ENV, Reset)
console.log(FgYellow, APP_HOST, Reset)

export default APP_HOST;