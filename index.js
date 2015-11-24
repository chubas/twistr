#!/usr/bin/env node
'use strict';

var fs = require('fs');
var _ = require('underscore');
var readline = require('readline');

// Utility
var shuffle = function(array) {
  var counter = array.length, temp, index;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}
console.log('Loading dict...');
var words = fs.readFileSync('/usr/share/dict/words').toString().split('\n');
var wordsByLength = {};

console.log('Building index...');

if(fs.existsSync('cache.json')) {
  console.log('Reading from cache');
  wordsByLength = JSON.parse(fs.readFileSync('./cache.json').toString());
  // Read from cache
} else {
  // Build cache and continue
  console.log('Building cache');
  var valid = /^[a-z]{3,}$/;
  words.forEach(function(w) {
    var sanitized = w.toLowerCase();
    if(!valid.test(sanitized)) {
      // console.log('NOT:', sanitized);
    }
    wordsByLength[w.length] = wordsByLength[w.length] || [];
    if(wordsByLength[w.length].indexOf(sanitized) !== -1) {
      // console.log('Repeated word::', w, sanitized);
    }
    wordsByLength[w.length].push(sanitized);
  });
  fs.writeFileSync('cache.json', JSON.stringify(wordsByLength));
}

console.log('Picking word');

var isSubword = function(word, initial) {
  // console.log('Is subword?', word, initial, _.difference(word.split(''), initial.split('')));
  // return _.difference(word.split(''), initial.split('')).length === 6 - word.length;
  var bag = initial.split('');
  word.split('').forEach(function(letter) {
    var index = bag.indexOf(letter);
    if(index >= 0) { // Found
      bag.splice(index, 1);
    }
  });
  return bag.length === 6 - word.length;

};

var buildGame = function(dict) {
  var initial, words;

  initial = _.sample(dict[6]);
  console.log('INITIAL WORD IS:', initial);
  words = _.flatten(
    _.map(_.range(3, 7), function(n) {
      return _.filter(dict[n], function(word) {
        return isSubword(word, initial);
      });
    })
  );

  return {
    letters : initial.split(''),
    words : _.uniq(words),
    discovered : []
  };
};

var game = buildGame(wordsByLength);
console.log('WORDS:', JSON.stringify(game.words, null, 2));

// Formats it as a string to add to a blessed screen
var renderDiscovered = function(words, discovered) {

  return words.map(function(word) {

    if(discovered.indexOf(word) >= 0) {
      return word;
    } else {
      return word.replace(/\w/g, '_');
    }
  }).join('  ');
};



var blessed = require('blessed');

var screen = blessed.screen();
var buffer = [];
var letterbag = game.letters.map(function(letter) {
  return {
    used : false,
    letter : letter
  };
});
shuffle(letterbag);

var renderGuess = function(letters, letterbag) {
  var content = '{center}{bold}';

  content = content + '\n\n' +
    letterbag.map(function(l) {
      return l.used ?
        '{red-bg}{black-fg}·{/black-fg}{/red-bg}' :
        '{green-fg}' + l.letter  + '{/green-fg}';
    }).join(' ') +
    '\n\n';
  for(var i = 0; i < 6; i++) {
    if(letters[i]) {
      content = content + letters[i] + (i === 5 ? '' : ' ');
    } else {
      content = content + '_' + (i === 5 ? '' : ' ');
    }
  }
  return content + '{/bold}{/center}';
};

var guessBox = blessed.box({
  fg : 'blue',
  bg : 'default',
  border : {
    fg : 'red',
    bg: 'red'
  },
  tags: true,
  content : renderGuess(buffer, letterbag),
  width : 30,
  height : 8,
  left: 'center',
  top: 3,
  hoverEffects: {
    bg: 'green'
  }
});

var resultsBox = blessed.box({
  tags: true,
  content: renderDiscovered(game.words, game.discovered),
  top: 15,
  left: 'center',
  shrink: 'flex',
  border : {
    fg : 'blue',
    type : 'line'
  },
  padding: {
    top: 1,
    bottom: 1,
    left: 5,
    right: 5
  }
});

var messageBox = blessed.box({
  fg: 'white',
  bg: 'green',
  bottom: 0,
  height: 4,
  width: '100%'
});

screen.append(guessBox);
screen.append(resultsBox);
screen.append(messageBox);

screen.on('keypress', function(key, ch) {
  if(ch.name === 'backspace') {
    var used = _.find(letterbag, function(l) {
      return l.used && l.letter === buffer.pop();
    });
    if(used) {
      used.used = false;
    }
  } else if(ch.name === 'enter') {
    var word = buffer.join('');
    buffer = [];
    letterbag.forEach(function(l) {
      l.used = false;
    });
    if(game.words.indexOf(word) >= 0) {
      messageBox.setContent('Guessed: ' + word + ' !');
      game.discovered.push(word);
    } else {
      messageBox.setContent('Wrong guess: ' + word);
    }
    resultsBox.setContent(renderDiscovered(game.words, game.discovered));
  } else if(/^[a-zA-Z]{1}$/.test(key)) {
    var available = _.find(letterbag, function(l) {
      return !l.used && l.letter === key;
    });
    if(available) {
      if(buffer.length < 6) {
        available.used = true;
        buffer.push(key);
      }
    } else {
      // Nothing happens
    }
    // console.log('PRESSED', key, ch);
    // console.log('BUFFER', buffer);
  } else if(ch.name === 'tab') {
    shuffle(letterbag);
  } else if(key === '`') {
    messageBox.setContent('SHHH. Words are: ' + game.words.join(' '));
  } else {
    // NOT A VALID KEY
    // console.log('PRESSED', key, ch);
  }
  guessBox.setContent(renderGuess(buffer, letterbag));
  screen.render();
});

screen.key(['escape', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
