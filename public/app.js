(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const $ = sel => document.querySelector(sel);
let editor;

const CODE = `class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return \`Hello, \${this.greeting}\`;
  }
}

type User = {
  firstName: string;
  lastName: string;
}

function getName(user: User):string {
  return Object.keys(user)
    .map(field => user[field])
    .join(' ');
}

let greeter = new Greeter(
  getName({
    firstName: 'Krasimir',
    lastName: 'Tsonev'
  })
);`;
let currentNodes = [];
let currentEditorMarker = null;
let rawAnalysis = false;
let typeOfAnalysis = 'scopes';

function analyze() {
  const container = $('.tokens .links');
  try {
    rawAnalysis = CodeInspector.analyze(editor.getValue());
  } catch(err) {
    container.innerHTML = err.toString();
    return;
  }

  switch (typeOfAnalysis) {
    case 'scopes':
      currentNodes = rawAnalysis.scopes;
      container.innerHTML = '<ul>' + 
        currentNodes
          .map((node, idx) => {
            const text = node.text.toString().replace(/</g, '&lt;');
            const style = `margin-left: ${(node.nesting) * 1}em;`;
            return `
              <a href="javascript:void(0)"
                style="${style}"
                onMouseOver="javascript:nodeOver(${idx})"
                onMouseOut="javascript:nodeOut()">
                  ${text} <small>${node.type}</small>
              </a>
            `;
          })
          .map(link => `<li>${link}</li>`).join('') + '</ul>';
      break;
    case 'all':
      currentNodes = rawAnalysis.nodes;
      container.innerHTML = '<ul>' + 
        currentNodes
          .map((node, idx) => {
            const text = node.text.toString().replace(/</g, '&lt;');
            return `
              <a href="javascript:void(0)"
                onMouseOver="javascript:nodeOver(${idx})"
                onMouseOut="javascript:nodeOut()">
                  ${text} <small>${node.type}</small>
              </a>
            `;
          })
          .map(link => `<li style="display: inline-block;">${link}</li>`).join('') + '</ul>';
      break;
    case 'ast':
      container.innerHTML = '';
      container.appendChild(renderjson(rawAnalysis.ast));
      break;
    default:
      break;
  }
}

window.nodeOver = (pairIdx) => {
  const node = currentNodes[parseInt(pairIdx)];
  if (node) {
    if (currentEditorMarker) {
      currentEditorMarker.clear();
    }
    currentEditorMarker = editor.markText(
      { line: node.start[0]-1, ch: node.start[1]-1 },
      { line: node.end[0]-1, ch: node.end[1]-1 },
      { className: 'ci-pair' }
    )
  } else {
    console.warn(`Node with index ${pairIdx} not found!`)
  }
}

window.nodeOut = () => {
  if (currentEditorMarker) {
    currentEditorMarker.clear();
  }
}

window.onload = function () {
  renderjson.set_icons('+', '-');
  renderjson.set_show_to_level(2);
  
  let focused = false;
  function onCursorActivity() {
    if (focused) {
      const { line, ch } = editor.getCursor();
      
    }
  }
  editor = CodeMirror.fromTextArea($('.editor textarea'), {
    lineNumbers: false,
    viewportMargin: Infinity,
    lineWrapping: true,
    mode: 'jsx'
  });
  editor.on('change', analyze);
  editor.on('cursorActivity', onCursorActivity);
  editor.on('focus', () => {
    focused = true;
    setTimeout(onCursorActivity, 1);
  });
  editor.on('blur', () => {
    focused = false;
    if (currentEditorMarker) {
      currentEditorMarker.clear();
    }
  });

  $('[name="type-of-analysis"]').addEventListener('change', (e) => {
    typeOfAnalysis = e.target.value;
    analyze();
  });

  editor.setValue(CODE);
  analyze();
}
},{}]},{},[1]);
