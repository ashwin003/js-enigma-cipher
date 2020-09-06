import './index.less';
const jsrender = require('jsrender')();

const availableRotors = {
    '1': new Rotor('EKMFLGDQVZNTOWYHXUSPAIBRCJ', ['Q']),         // Enigma 1
    '2': new Rotor('AJDKSIRUXBLHWTMCQGZNPYFVOE', ['E']),         // Enigma 1
    '3': new Rotor('BDFHJLCPRTXVZNYEIWGAKMUSQO', ['V']),         // Enigma 1
    '4': new Rotor('ESOVPZJAYQUIRHXLNFTGKDCMWB', ['J']),         // M3 Army
    '5': new Rotor('VZBRGITYUPSDNHLXAWMJQOFECK', ['Z']),         // M3 Army
    '6': new Rotor('JPGVOUMFYQBENHZRDKASXLICTW', ['Z', 'M']),    // M3 & M4 Naval (FEB 1942)
    '7': new Rotor('NZJHGRCXMYSWBOUFAIVLPEKQDT', ['Z', 'M']),    // M3 & M4 Naval (FEB 1942)
    '8': new Rotor('FKQHTLXOCBJSPDZRAMEWNIUYGV', ['Z', 'M'])     // M3 & M4 Naval (FEB 1942)
};

const availableReflectors = {
    'A': new Reflector(
        {"A":"E","B":"J","C":"M","D":"Z","E":"A","F":"L","G":"Y","H":"X","I":"V","J":"B","K":"W","L":"F","M":"C","N":"R","O":"Q","P":"U","Q":"O","R":"N","S":"T","T":"S","U":"P","V":"I","W":"K","X":"H","Y":"G","Z":"D"}
    ),
    'B': new Reflector(
        {"A":"Y","B":"R","C":"U","D":"H","E":"Q","F":"S","G":"L","H":"D","I":"P","J":"X","K":"N","L":"G","M":"O","N":"K","O":"M","P":"I","Q":"E","R":"B","S":"F","T":"Z","U":"C","V":"W","W":"V","X":"J","Y":"A","Z":"T"}
    ),
    'C': new Reflector(
        {"A":"F","B":"V","C":"P","D":"J","E":"I","F":"A","G":"O","H":"Y","I":"E","J":"D","K":"R","L":"Z","M":"X","N":"W","O":"G","P":"C","Q":"T","R":"K","S":"U","T":"Q","U":"S","V":"B","W":"N","X":"M","Y":"H","Z":"L"}
    ),
    'BThin': new Reflector(
        {"A":"E","B":"N","C":"K","D":"Q","E":"A","F":"U","G":"Y","H":"W","I":"J","J":"I","K":"C","L":"O","M":"P","N":"B","O":"L","P":"M","Q":"D","R":"X","S":"Z","T":"V","U":"F","V":"T","W":"H","X":"R","Y":"G","Z":"S"}
    ),
    'CThin': new Reflector(
        {"A":"R","B":"D","C":"O","D":"B","E":"J","F":"N","G":"T","H":"K","I":"V","J":"E","K":"H","L":"M","M":"L","N":"F","O":"C","P":"W","Q":"Z","R":"A","S":"X","T":"G","U":"Y","V":"I","W":"P","X":"S","Y":"U","Z":"Q"}
    )
};

const enigmaMachine = new EnigmaMachine(availableRotors, availableReflectors);
enigmaMachine.initialize();
enigmaMachine.render();

// Encapsulates the main functions of the Enigma machine
function EnigmaMachine(availableRotors, availableReflectors) {
    this.characterSet = ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L'];

    this.plainText = '';
    this.cipherText = '';

    this.letterCount = 0;
    this.batchSize = 5;

    this.selectedRotors = ['1', '2', '3'];
    this.selectedReflector = 'B';

    this.rotors = [];

    this.reflector = undefined;

    this.initialize = function() {
        this.rotors = this.selectedRotors.map(function(r) {
            return availableRotors[r];
        });
        this.rotors.reverse();

        this.reflector = availableReflectors[this.selectedReflector];
    }

    this.update = function(rotors, reflector) {
        this.selectedRotors = rotors;
        this.selectedReflector = reflector;

        this.initialize();
        this.render();
    }

    this.render = function() {

        // Initialize plain and cipher texts
        this.plainText = '';
        this.cipherText = '';

        // Paper with plain and cipher texts
        this.renderPaper();

        // Rotor
        this.renderRotors();

        // Keyboard
        this.renderKeyboard();
        this.attachKeyboardEvents();
    }

    this.renderRotors = function() {
        const rotorsToDisplay = this.rotors.map(function(rotor) {
            return {
                currentCharacter: rotor.selectedCharacter(),
                previousCharacter: rotor.previousCharacter(),
                nextCharacter: rotor.nextCharacter()
            };
        });
        rotorsToDisplay.reverse();
        const tmpl = jsrender.templates(document.querySelector('#rotorTemplate').innerHTML);
        const html = tmpl.render(rotorsToDisplay);
        document.querySelector('.rotors').innerHTML = html;
    }

    this.renderKeyboard = function() {
        const charactersToRender = this.characterSet.map(function(c) { return { character: c }; });
        const tmpl = jsrender.templates(document.querySelector('#keyTemplate').innerHTML);
        const html = tmpl.render(charactersToRender);
        document.querySelector('#keyboard').innerHTML = html;
    }

    this.attachKeyboardEvents = function() {
        const buttons = document.querySelectorAll('[data-character]');
        const instance = this;
        for(const button of buttons) {
            button.addEventListener('click', function(e) {
                instance.encrypt(this.getAttribute('data-character'));
            });
        }
    }

    this.encrypt = function(inputCharacter) {
        if(this.letterCount % this.batchSize === 0) {
            this.plainText += ' ';    
        }

        this.plainText += inputCharacter;
        this.rotateRotors();
        
        this.renderRotors();

        if(this.letterCount % this.batchSize === 0) {
            this.cipherText += ' ';    
        }

        this.cipherText += this.encryptInput(inputCharacter);

        this.letterCount++;

        this.renderPaper();
    }

    this.rotateRotors = function() {
        if(this.rotors.length > 0) {
            this.rotors[0].rotate();
            for(let index = 1; index < this.rotors.length; index++) {
                if(this.rotors[index - 1].hasReachedTurnoverNotch()) {
                    this.rotors[index].rotate();
                }
            }
        }
    }

    this.encryptInput = function(inputCharacter) {
        let encryptedCharacter = inputCharacter;
        let rotorsToProcess = this.rotors.slice();
        // Processing via Rotors in the forward direction
        for(const rotor of rotorsToProcess) {
            encryptedCharacter = rotor.process(encryptedCharacter);
        }

        // Processing via the Reflector
        encryptedCharacter = this.reflector.process(encryptedCharacter);

        // Processing via Rotors in the reverse direction
        rotorsToProcess.reverse();
        for(const rotor of rotorsToProcess) {
            encryptedCharacter = rotor.processReverse(encryptedCharacter);
        }

        return encryptedCharacter;
    }

    this.renderPaper = function() {
        const tmpl = jsrender.templates(document.querySelector('#paperTemplate').innerHTML);
        const data = {
            plainText: this.plainText,
            cipherText: this.cipherText
        };
        const html = tmpl.render(data);
        document.querySelector('.paper').innerHTML = html;
    }
}

function Reflector(mapping) {
    this.mapping = mapping;

    this.process = function(inputCharacter) {
        return this.mapping[inputCharacter];
    }
}


function Rotor(mapping, turnOverNotch) {
    this.characterSet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    this.currentIndex = 0;
    this.mappedSide = mapping;
    this.turnOverNotch = turnOverNotch;

    this.previousIndex = function () {
        if (this.currentIndex === 0) {
            return this.characterSet.length - 1;
        }
        return this.currentIndex - 1;
    };
    this.nextIndex = function () {
        return (this.currentIndex + 1) % this.characterSet.length;
    };
    
    this.selectedCharacter = function () {
        return this.characterSet[this.currentIndex];
    };
    this.previousCharacter = function () {
        return this.characterSet[this.previousIndex()];
    };
    this.nextCharacter = function () {
        return this.characterSet[this.nextIndex()];
    };
    
    this.rotate = function () {
        this.currentIndex = (this.currentIndex + 1) % this.characterSet.length;
    };

    this.hasReachedTurnoverNotch = function() {
        return this.turnOverNotch.indexOf(this.selectedCharacter()) > -1;
    };

    
    this.process = function(inputCharacter) {
        const offset = this.currentIndex;
        let pos = this.characterSet.indexOf(inputCharacter);
        const letter = this.mappedSide[(pos + offset) % this.characterSet.length];
        pos = this.characterSet.indexOf(letter);

        return this.characterSet[(pos - offset + this.characterSet.length) % this.characterSet.length];
    }

    this.processReverse = function(inputCharacter) {
        let pos = this.characterSet.indexOf(inputCharacter);
        const letter = this.characterSet[(pos + this.currentIndex) % this.characterSet.length];
        pos = this.mappedSide.indexOf(letter);
        return this.characterSet[(pos - this.currentIndex + this.characterSet.length) % this.characterSet.length];
    }
}