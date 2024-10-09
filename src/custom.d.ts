// For importing css rules from .css files as a string
declare module '*.css' {
  const content: string;
  export default content;
}