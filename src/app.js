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
let currentPairs = [];
let currentScopeMarker = null;
let markScope = false;
let rawAnalysis = false;

function analyze() {
  const pairs = pairify.analyze(editor.getValue());

  if (rawAnalysis) {
    $('.tokens .links').innerHTML = `<div class="raw"><pre><code>[\n${
      pairs.map(pair => {
        return `  ${JSON.stringify(pair)}`;
      }).join(',\n')
    }\n]</code></pre></div>`;
  } else {
    const pairsByType = pairs.reduce((res, pair) => {
      if (!res[pair.type]) res[pair.type] = [];
      res[pair.type].push(pair);
      return res;
    }, {});
    currentPairs = Object.keys(pairsByType)
    .reduce((res, type) => {
      return res.concat(pairsByType[type]);
    }, []);
    $('.tokens .links').innerHTML = '<ul>' + 
      currentPairs
      .map((pair, idx) => {
        return `
          <a href="javascript:void(0)" onMouseOver="javascript:pairOver(${idx})"><strong>${pair.type}</strong> <small>${pair.from[0]}:${pair.from[1]} ― ${pair.to[0]}:${pair.to[1]}</small></a>
        `;
      })
      .map(link => `<li>${link}</li>`).join('') + '</ul>';
  }
}

window.pairOver = (pairIdx) => {
  const pair = currentPairs[parseInt(pairIdx)];
  if (pair) {
    if (currentScopeMarker) {
      currentScopeMarker.clear();
    }
    currentScopeMarker = editor.markText(
      { line: pair.from[0]-1, ch: pair.from[1]-1 },
      { line: pair.to[0]-1, ch: pair.to[1]-1 },
      { className: 'pairify-pair' }
    )
  } else {
    console.warn(`Pair with index ${pairIdx} not found!`)
  }
}

window.onload = function () {
  let focused = false;
  function onCursorActivity() {
    if (focused) {
      const { line, ch } = editor.getCursor();
      $('.cursor').innerHTML = `${line+1}:${ch+1}`;
      
      const matchingPairs = pairify.match(editor.getValue(), line+1, ch+1).filter(({ type }) => type === 'curly');
      if (currentScopeMarker) {
        currentScopeMarker.clear();
      }
      if (matchingPairs.length > 0 && markScope) {
        const {from, to} = matchingPairs.pop();
        currentScopeMarker = editor.markText(
          { line: from[0]-1, ch: from[1]-1 },
          { line: to[0]-1, ch: to[1]-1 },
          { className: 'pairify-scope' }
        )
      }
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
    $('.cursor').style.display = 'block';
    setTimeout(onCursorActivity, 1);
  });
  editor.on('blur', () => {
    focused = false;
    $('.cursor').style.display = 'none';
    if (currentScopeMarker) {
      currentScopeMarker.clear();
    }
  });

  $('.mark-current-scope').addEventListener('change', () => {
    markScope = !markScope;
    if (currentScopeMarker) {
      currentScopeMarker.clear();
    }
  });

  $('.raw-analysis').addEventListener('change', () => {
    rawAnalysis = !rawAnalysis;
    analyze();
  });

  editor.setValue(CODE);
  analyze();
}