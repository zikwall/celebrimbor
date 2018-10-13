/**
 * 
 */
import { CelebrimborRecognition } from './CelebrimborRecognition.js';

export default class CelebrimborUI extends CelebrimborRecognition
{
    constructor() {
        super();

        this.getProps().ui.events = {
            // events on init Celebrimbor UI
            BEFORE_INIT: 'BEFORE_INIT',
            AFTER_INIT: 'AFTER_INIT',

            // events on create Celebrimbor UI inteface
            BEFORE_CREATE: 'BEFORE_CREATE',
            AFTER_CREATE: 'AFTER_CREATE',

            // events on show|hide UI
            BEFORE_SHOW: 'BEFORE_SHOW',
            AFTER_SHOW: 'AFTER_SHOW',
            BEFORE_HIDE: 'BEFORE_HIDE',
            AFTER_HIDE: 'AFTER_HIDE',

            // events on status UI
            BEFORE_ON: 'BEFORE_ON',
            AFTER_ON: 'AFTER_ON',
            BEFORE_OFF: 'BEFORE_OFF',
            AFTER_OFF: 'AFTER_OFF',

            // events on render UI
            BEFORE_RENDER: 'BEFORE_RENDER',
            AFTER_RENDER: 'AFTER_RENDER',

            // events on set stylesheet
            BEFORE_SET_STYLESHEET: 'BEFORE_SET_STYLESHEET',
            AFTER_SET_STYLESHEET: 'AFTER_SET_STYLESHEET',
        };

        this.initUI();
    }
    
    initUI() {
        this.getCelebrimbor().celebrimborUI = this;
        this.getCelebrimbor().properties.ui.isInit = true;

        /**
         * По умолчанию команды Celebrimbor
         */
        this.setStartCommand(this.start);
        this.setAbortCommand(this.abort);

        this.addCallback('start', this.onStart);
        this.addCallback('end', this.onEnd);
        this.addCallback('resultMatch', this.setRecognizedSentence);
        this.addCallback('resultNoMatch', this.setRecognizedSentence);
        
        this.createGUI();
    }
    
    getUI() {
        return this.getCelebrimbor().properties.ui;
    }
    
    isGuiCreated() {
        return this.getUI().guiNodes !== undefined;
    }
    
    updateStylesheet() {
        if (this.getUI().stylesheet && this.isGuiCreated()) {
            if (this.getUI().stylesheetNode) {
                this.getUI().stylesheetNode.href = this.getUI().stylesheet;
            } else {
                this.getUI().stylesheetNode = document.createElement('link');
                this.getUI().stylesheetNode.rel = 'stylesheet';
                this.getUI().stylesheetNode.href = this.getUI().stylesheet;
                this.getUI().stylesheetNode.id = 'celebrimbor-ui-style-sheet';
                document.body.appendChild(this.getUI().stylesheetNode);
            }
        }
    }
    
    updateListeningText() {
        
        if (!this.isGuiCreated()) {
            this.console('Celebrimbor GUI is not cerated!', 'warn');
            return;
        }
        let ui = this.getUI().uiElements;
        let samplesNode = document.getElementById(ui.listen.spanSamples);

        if (this.getCelebrimbor().sampleCommands.length) {
            
            if (!samplesNode) {
                let nodeToInsertAfter = document.getElementById(ui.listen.spanInstructions);
                samplesNode = document.createElement('span');
                samplesNode.id = ui.listen.spanSamples;
                nodeToInsertAfter.parentNode.insertBefore(samplesNode, nodeToInsertAfter.nextSibling);
            }
            
            samplesNode.innerHTML = this.getCelebrimbor().sampleCommands.join('. ')+'.';
            this.getUI().guiNodes.classList.add(ui.divRoot.cssClasses.sampleCommands);
        } else {
            if (samplesNode) {
                samplesNode.parentNode.removeChild(samplesNode);
            }
            
            this.getUI().guiNodes.classList.remove(ui.divRoot.cssClasses.sampleCommands);
        }
    }
    
    updateRecognizedSentenceText() {
        if (!this.isGuiCreated()) {
            return;
        }
        let ui = this.getUI().uiElements;
        let recognizedSentenceNode = document.getElementById(ui.listen.spanSentence);
        let lastRecognizedSentenceText = this.getLastRecognizedSentence();
        
        if (lastRecognizedSentenceText && this.getCelebrimbor().displayRecognizedSentence) {
            if (!recognizedSentenceNode) {
                let nodeToInsertAfter = document.getElementById(ui.listen.spanSamples) || document.getElementById(ui.listen.spanInstructions);
                recognizedSentenceNode = document.createElement('span');
                recognizedSentenceNode.id = ui.listen.spanSentence;
                nodeToInsertAfter.parentNode.insertBefore(recognizedSentenceNode, nodeToInsertAfter.nextSibling);
            }
            recognizedSentenceNode.innerText = lastRecognizedSentenceText;
            this.getUI().guiNodes.classList.add(ui.divRoot.cssClasses.sencence);
        } else {
            if (recognizedSentenceNode) {
                recognizedSentenceNode.parentNode.removeChild(recognizedSentenceNode);
            }
            this.getUI().guiNodes.classList.remove(ui.divRoot.cssClasses.sencence);
        }
    }
    
    createGUI() {
        this.triggerEvent(this.getProps().ui.events.BEFORE_CREATE);
        let ui = this.getUI().uiElements;
        this.getUI().guiNodes = document.createElement('div');
        this.getUI().guiNodes.id = ui.divRoot.id;
        this.getUI().guiNodes.innerHTML = '<a id="'+ui.button+'">&nbsp;</a>' +
            '<label for="'+ui.button+'" id="'+ui.label+'">'+this.getProps().text.toggleLabelText+'</label>' +
            '<div id="'+ui.listen.divBox+'"><div id="'+ui.listen.divText+'">' +
            '<span id="'+ui.listen.spanInstructions+'">'+this.getProps().text.listeningInstructionsText+'</span>' +
            '</div></div>';
        this.getUI().guiNodes.style.display = 'none';

        if (this.isListening()) {
            this.setGUIListening();
        } else {
            this.setGUINotListening();
        }

        document.body.appendChild(this.getUI().guiNodes);

        this.updateListeningText();
        this.updateStylesheet();

        // Attach events
        document.getElementById(ui.button).addEventListener('click', () => {
            this.toggleRecognition();
        });

        this.setStylesheet('../celebrimbor/styles/flat.css');

        this.triggerEvent(this.getProps().ui.events.AFTER_CREATE);
    }
    
    setGUIListening() {
        if (!this.isGuiCreated()) {
            return;
        }
        let ui = this.getUI().uiElements.divRoot.cssClasses;
        this.getUI().guiNodes.classList.remove(ui.notListen);
        this.getUI().guiNodes.classList.add(ui.listen);
    }
    
    setGUINotListening() {
        if (!this.isGuiCreated()) {
            return;
        }
        let ui = this.getUI().uiElements.divRoot.cssClasses;
        this.getUI().guiNodes.classList.add(ui.notListen);
        this.getUI().guiNodes.classList.remove(ui.listen);
    }
    
    setStatusOn() {
        this.triggerEvent(this.getProps().ui.events.BEFORE_ON);
        if (!this.isListening()) {
            this.getProps().speech.isListening = true;
            this.setGUIListening();
        }
        this.triggerEvent(this.getProps().ui.events.AFTER_ON);
    }
    
    setStatusOff() {
        let time = new Date();

        this.triggerEvent(this.getProps().ui.events.BEFORE_OFF, {timestamp: time.getTime()});
        if (this.isListening()) {
            this.getProps().speech.isListening = false;
            this.setGUINotListening();
        }
        this.triggerEvent(this.getProps().ui.events.AFTER_OFF);
    }
    
    setText(text, id) {
        if (this.isGuiCreated()) {
            document.getElementById(id).innerHTML = text;
        }
    }
    
    celebrimborSetRecognizedSentence(sentences) {
        if (Array.isArray(sentences)) {
            sentences = sentences[0];
        }
        
        this.setRecognizedSentence(sentences);
    }
    
    saveListeningStatusCookie() {
        let dtExpiration = new Date();
        
        dtExpiration.setTime(dtExpiration.getTime() + 60000 * this.getUI().minutesToRememberStatus);
        document.cookie='celebrimbor_remember=1; expires=' + dtExpiration.toUTCString() + '; path=/';
    }
    
    deleteListeningStatusCookie() {
        document.cookie='celebrimbor_remember=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
    
    listeningStatusCookieExists() {
        return document.cookie.indexOf('celebrimbor_remember') !== -1;
    }
    
    ifNotFunctionThrowError(func, errorText) {
        if (typeof func !== 'function') {
            throw new TypeError(errorText);
        }
    }

    setStartCommand(callback, context) {
        // Это должно работать как при передаче функции, так и в имени функции
        callback = this[callback] || callback;
        
        this.ifNotFunctionThrowError(callback, 'Invalid callback function');
        context = context || this;

        this.getUI().startCommand = {
            callback: callback, 
            context: context
        };
    }
    
    setAbortCommand(callback, context) {
        // Это должно работать как при передаче функции, так и в имени функции
        callback = this[callback] || callback;
        this.ifNotFunctionThrowError(callback, 'Invalid callback function');
        context = context || this;

        this.getUI().abortCommand = {
            callback: callback, 
            context: context
        };
    }
    
    startRecognition() {
        if (!this.getUI().startCommand) {
            throw new TypeError('Cannot start recognition. Start command not defined');
        }
        
        // Если вам нужно запомнить статус, сохряняем cookie
        if (this.getUI().minutesToRememberStatus) {
            this.saveListeningStatusCookie();
        }
        
        this.getUI().startCommand.callback.apply(this.getUI().startCommand.context);
        this.setStatusOn();
    }
    
    abortRecognition() {
        if (!this.getUI().abortCommand) {
            throw new TypeError('Cannot abort recognition. Abort command not defined');
        }

        this.deleteListeningStatusCookie();
        this.getUI().abortCommand.callback.apply(this.getUI().abortCommand.context);
        this.setStatusOff();
    }
    
    toggleRecognition() {
        if (this.isListening()) {
            this.abortRecognition();
        } else {
            this.startRecognition();
        }
    }
    
    onStart() {
        window.clearTimeout(this.getUI().listeningStoppedTimeout);
        this.setStatusOn();
    }
    
    onEnd() {
        this.getUI().listeningStoppedTimeout = setTimeout(this.setStatusOff, 100);
    }
    
    setStylesheet(css) {
        this.triggerEvent(this.getProps().ui.events.BEFORE_SET_STYLESHEET);
        this.getUI().stylesheet = css;
        this.updateStylesheet();
        this.triggerEvent(this.getProps().ui.events.AFTER_SET_STYLESHEET);
    }
    
    render() {
        this.triggerEvent(this.getProps().ui.events.BEFORE_RENDER);

        if (!this.isGuiCreated()) {
            this.createGUI();
        }
        
        // Если существует статус cookie, начинается прослушивание
        if (this.listeningStatusCookieExists() && !this.isListening()) {
            this.startRecognition();
        }

        this.triggerEvent(this.getProps().ui.events.AFTER_RENDER);
    }
    
    hide() {
        this.triggerEvent(this.getProps().ui.events.BEFORE_HIDE);

        if (!this.isGuiCreated()) {
            throw new TypeError('cannot hide interface. Must be rendered first');
        }
        
        this.getUI().guiNodes.classList.add('celebrimbor-ui--hidden');

        this.triggerEvent(this.getProps().ui.events.AFTER_HIDE);
    }
    
    show() {
        this.triggerEvent(this.getProps().ui.events.BEFORE_SHOW);

        if (!this.isGuiCreated()) {
            throw new TypeError('cannot show interface. Must be rendered first');
        }
        
        this.getUI().guiNodes.classList.remove('celebrimbor-ui--hidden');

        this.triggerEvent(this.getProps().ui.events.AFTER_SHOW);
    }
    
    isListening() {
        return this.getProps().speech.isListening;
    }
    
    setToggleLabelText(text) {
        this.getProps().text.toggleLabelText = text;
        this.setText(text, this.getUI().uiElements.label);
    }
    
    setInstructionsText(text) {
        if (typeof text === 'string') {
            this.getProps().text.listeningInstructionsText = text;
            this.setText(text, this.getUI().uiElements.listen.spanInstructions);
        }
    }
    
    setSampleCommands(commands) {
        if (!Array.isArray(commands)) {
            this.console('Sample commands is not array', 'warn');
            commands = [];
        }
        
        this.getCelebrimbor().sampleCommands = commands;
        this.updateListeningText();
    }
    
    rememberStatus(minutes) {
        if (typeof minutes !== 'number' || minutes < 0) {
            throw new TypeError('rememberStatus() only accepts positive integers');
        }
        
        this.getUI().minutesToRememberStatus = minutes;
    }
    
    getLastRecognizedSentence() {
        if (this.getCelebrimbor().recognizedSentences.length === 0) {
            return undefined;
        } else {
            return this.getCelebrimbor().recognizedSentences[this.getCelebrimbor().recognizedSentences.length-1];
        }
    }
    
    setRecognizedSentence(sentence) {
        if (typeof sentence === 'string') {
            this.getCelebrimbor().recognizedSentences.push(sentence);
            this.updateRecognizedSentenceText();
        }
    }
    
    displayRecognizedSentence(newState) {
        if (arguments.length > 0) {
            this.getCelebrimbor().displayRecognizedSentence = !!newState;
        } else {
            this.getCelebrimbor().displayRecognizedSentence = true;
        }
        
        this.updateRecognizedSentenceText();
    }


}