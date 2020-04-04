const $ = sel => document.querySelector(sel);
let editor;

const CODE = `import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

function printAnswer(answer) {
  console.log(\`The answer is: \${answer}\`);
}`;
let currentNodes = [];
let currentEditorMarker = null;
let rawAnalysis = false;
let typeOfAnalysis = 'scopes';

function analyze() {
  try {
    rawAnalysis = CodeInspector.analyze(editor.getValue());
  } catch(err) {
    $('.tokens .links').innerHTML = err.toString();
    return;
  }

  switch (typeOfAnalysis) {
    case 'scopes':
      currentNodes = rawAnalysis.scopes;
      break;
    case 'all':
      currentNodes = rawAnalysis.nodes;
      break;
    default:
      break;
  }

  if (currentNodes) {
    $('.tokens .links').innerHTML = '<ul>' + 
      currentNodes
        .map((node, idx) => {
          const text = node.text.toString().replace(/</g, '&lt;');
          return `
            <a href="javascript:void(0)"
              style="margin-left: ${(node.nesting-1) * 1}em;"
              onMouseOver="javascript:nodeOver(${idx})"
              onMouseOut="javascript:nodeOut()">
                ${text}
            </a>
          `;
        })
        .map(link => `<li>${link}</li>`).join('') + '</ul>';
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