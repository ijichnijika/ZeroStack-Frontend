import hljs from 'highlight.js';
console.log(hljs.getLanguage('vue') ? 'Vue is supported' : 'Vue is NOT supported');
console.log(hljs.getLanguage('javascript') ? 'JS is supported' : 'JS is NOT supported');
console.log(hljs.getLanguage('ts') ? 'TS is supported' : 'TS is NOT supported');
