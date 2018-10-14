/**
 * 
 */
import { Celebrimbor } from './Celebrimbor.js';
import CelebrimborSynthesis from "./CelebrimborSynthesis.js";
import CelebrimborUI from "./CelebrimborUI.js";

export class CelebrimborRecognition extends Celebrimbor
{
    constructor() {
        super();

        this.getProps().speech.events = {
            BEFORE_INIT: 'BEFORE_INIT',
            AFTER_INIT: 'AFTER_INIT',
            BEFORE_START: 'BEFORE_START',
            AFTER_START: 'AFTER_START',
            BEFORE_END: 'BEFORE_END',
            AFTER_END: 'AFTER_END',
            BEFORE_PAUSE: 'BEFORE_PAUSE',
            AFTER_PAUSE: 'AFTER_PAUSE',
            BEFORE_RESUME: 'BEFORE_RESUME',
            AFTER_RESUME: 'AFTER_RESUME',
        };
    }

    initConditional() {
        if (!this.isInitialized()) {
            this.initCelebrimborRecognition({}, false);
        }
    };

    /**
     *
     * @returns {SpeechRecognition|webkitSpeechRecognition|mozSpeechRecognition|msSpeechRecognition|oSpeechRecognition|speechRecognition|boolean}
     */
    getRecognition() {
        return this.getCelebrimbor().speechRecognition;
    }

    /**
     *
     * @returns {boolean}
     */
    isInitialized() {
        return this.getRecognition() !== false;
    };

    /**
     *
     * @param {Object} commands
     * @param {boolean} isReset
     */
    initCelebrimborRecognition(commands, isReset = false) {
        this.triggerEvent(this.getProps().speech.events.BEFORE_INIT);
        // Прервать уже запущенные экземпляры распознавания речи
        if (this.celebrimborSpeech && this.celebrimborSpeech.abort) {
            this.celebrimborSpeech.abort();

            if(this.isDebug()) {
                this.console('Прерваны предыдущие сеансы распознавания');
            }
        }

        // initiate SpeechRecognition
        this.getCelebrimbor().speechRecognition = this.celebrimborSpeech;

        // Set the max number of alternative transcripts to try and match with a command
        this.getRecognition().maxAlternatives = 5;

        // In HTTPS, turn off continuous mode for faster results.
        // In HTTP,  turn on  continuous mode for much slower results, but no repeating security notices
        this.getRecognition().continuous = window.location.protocol === 'http:';

        // Sets the language to the default 'ru-RU'. This can be changed with annyang.setLanguage()
        this.getRecognition().lang = 'ru-RU';
        
        this.getRecognition().onstart = () => {
            this.getProps().speech.isListening = true;
            this.invokeCallbacks(this.callbacks.start);
        };
        
        this.getRecognition().onsoundstart = () => {
            this.invokeCallbacks(this.callbacks.soundstart);
        };
        
        this.getRecognition().onerror = (event) => {
            this.invokeCallbacks(this.callbacks.error, event);
            switch (event.error) {
                case 'network':
                    this.invokeCallbacks(this.callbacks.errorNetwork, event);
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                
                    // if permission to use the mic is denied, turn off auto-restart
                    this.getProps().speech.autoRestart = false;
                    
                    // determine if permission was denied by user or automatically.
                    if (new Date().getTime() - this.getProps().speech.lastStartedAt < 200) {
                        this.invokeCallbacks(this.callbacks.errorPermissionBlocked, event);
                    } else {
                        this.invokeCallbacks(this.callbacks.errorPermissionDenied, event);
                    }
                    
                    break;
            }
        };
        
        this.getRecognition().onend = () => {
            this.getProps().speech.isListening = false;
                
            this.invokeCallbacks(this.callbacks.end);

            if(this.isDebug()) {
                console.log('Celebrimbor recognition finished');
            }

            // автоматическая перезагрузка, при завершении слушания
            if (this.getProps().speech.autoRestart) {
                    
                // перезапуск не чаще одного раза в секунду
                let timeSinceLastStart = new Date().getTime() - this.getProps().speech.lastStartedAt;
                    
                this.getProps().speech.autoRestartCount += 1;
                    
                if (this.getProps().speech.autoRestartCount % 10 === 0) {
                    if (this.isDebug()) {
                        this.console('Speech Recognition is repeatedly stopping and starting. See http://is.gd/annyang_restarts for tips.', 'warn');
                    }
                }

                if (timeSinceLastStart < 1000) {
                    setTimeout(() => {
                        this.start({ paused: this.getProps().speech.pauseListening });
                    }, 1000 - timeSinceLastStart);
                } else {
                    this.start({ paused: this.getProps().speech.pauseListening });
                }
            }
        };
        
        this.getRecognition().onresult = (event) => {
            if (this.getProps().speech.pauseListening) {
                if (this.isDebug()) {
                    this.console('Speech heard, but celebrimbor is paused', 'info');
                }
                
                return false;
            }

            // Map the results to an array
            let speechRecognitionResult = event.results[event.resultIndex];
            let results = [];
            
            for (let k = 0; k < speechRecognitionResult.length; k++) {
                results[k] = speechRecognitionResult[k].transcript;
            }

            this.parseResults(results);
        };

        if (isReset) {
            this.getCelebrimbor().commands = [];
        }

        if (commands.length) {
            this.addCommands(commands);
        }

        if(this.isDebug()) {
            this.console('initCelebrimborRecognition success', 'info');
        }
        this.triggerEvent(this.getProps().speech.events.AFTER_INIT);
    }

    /**
     *
     * @param {Object} options
     */
    start(options) {
        this.initConditional();
        this.triggerEvent(this.getProps().speech.events.BEFORE_START);
        options = options || {};
        
        if (options.paused !== undefined) {
            this.getProps().speech.pauseListening = !!options.paused;
        } else {
            this.getProps().speech.pauseListening = false;
        }
        
        if (options.autoRestart !== undefined) {
            this.getProps().speech.autoRestart = !!options.autoRestart;
        } else {
            this.getProps().speech.autoRestart = true;
        }
        
        if (options.continuous !== undefined) {
            this.getRecognition().continuous = !!options.continuous;
        }

        this.getProps().speech.lastStartedAt = new Date().getTime();
        
        try {
            this.getRecognition().start();
            if(this.isDebug()) {
                this.console('onStart', 'info');
            }
        } catch (e) {
            if (this.isDebug()) {
                this.console(e.message, 'error');
            }
        }
        this.triggerEvent(this.getProps().speech.events.AFTER_START);
    }
    
    abort() {
        this.getProps().speech.autoRestart = false;
        this.getProps().speech.autoRestartCount = 0;
        
        if (this.isInitialized()) {
            this.getRecognition().abort();
        }
    }
    
    pause() {
        this.triggerEvent(this.getProps().speech.events.BEFORE_PAUSE);
        this.getProps().speech.pauseListening = true;
        this.triggerEvent(this.getProps().speech.events.AFTER_PAUSE);
    }
    
    resume() {
        this.triggerEvent(this.getProps().speech.events.BEFORE_RESUME);
        this.start();
        this.triggerEvent(this.getProps().speech.events.AFTER_RESUME);
    }
    
    addCommands(commands) {
        let cb;

        this.initConditional();

        for (let phrase in commands) {
            if (commands.hasOwnProperty(phrase)) {
                cb = this[commands[phrase]] || commands[phrase];
                if (typeof cb === 'function') {
                    // convert command to regex then register the command
                    this.registerCommand(this.commandToRegExp(phrase), cb, phrase);
                } else if ((typeof cb === 'undefined' ? 'undefined' : _typeof(cb)) === 'object' && cb.regexp instanceof RegExp) {
                    // register the command
                    this.registerCommand(new RegExp(cb.regexp.source, 'i'), cb.callback, phrase);
                } else {

                    if (this.isDebug()) {
                        this.console('Can not register command: %c' + phrase, 'info');
                    }
                    
                    continue;
                }
            }
        }
    }

    /**
     *
     * @param commandsToRemove
     */
    removeCommands(commandsToRemove) {
        if (commandsToRemove === undefined) {
            commandsList = [];
        } else {
            commandsToRemove = Array.isArray(commandsToRemove) ? commandsToRemove : [commandsToRemove];
            this.getCelebrimbor().commands = this.getCelebrimbor().commands.filter((command) => {
                for (let i = 0; i < commandsToRemove.length; i++) {
                    if (commandsToRemove[i] === command.originalPhrase) {
                        return false;
                    }
                }
                
                return true;
            });
        }
    }

    /**
     *
     * @param type
     * @param callback
     * @param context
     */
    addCallback(type, callback, context) {
        let cb = this[callback] || callback;
        if (typeof cb === 'function' && this.callbacks[type] !== undefined) {
            this.callbacks[type].push({ callback: cb, context: context || this });
        }
    }

    /**
     *
     * @param type
     * @param callback
     */
    removeCallback(type, callback) {
    
        let compareWithCallbackParameter = (cb) => {
            return cb.callback !== callback;
        };
        
        for (let callbackType in callbacks) {
            if (this.callbacks.hasOwnProperty(callbackType)) {

                if (type === undefined || type === callbackType) {
                    if (callback === undefined) {
                        this.callbacks[callbackType] = [];
                    } else {
                        this.callbacks[callbackType] = this.callbacks[callbackType].filter(compareWithCallbackParameter);
                    }
                }
            }
        }
    }

    /**
     *
     * @returns {boolean}
     */
    isListening() {
        return this.getProps().speech.isListening && !this.getProps().speech.pauseListening;
    }

    /**
     *
     * @param language
     */
    setLanguage(language) {
        this.initConditional();
        this.getRecognition().lang = language;
    }

    /**
     *
     * @param options
     * @returns {CelebrimborSynthesis}
     */
    synthesis(options = {}) {
        if(this.getCelebrimbor().speechSynthesis instanceof CelebrimborSynthesis && this.getCelebrimbor().speechSynthesis !== null) {
            this.getCelebrimbor().speechSynthesis.initSynthesisConditional();
            return this.getCelebrimbor().speechSynthesis;
        }

        if(this.isDebug()) {
            this.console('New instance CelebrimborSynthesis in CelebrimborRecognition', 'info');
        }

        this.getCelebrimbor().speechSynthesis = new CelebrimborSynthesis(options);

        return this.getCelebrimbor().speechSynthesis;
    }

    /**
     * @description not using
     * @returns {boolean}
     */
    ui() {
        this.abort();

        if(this.getCelebrimbor().celebrimborUI instanceof CelebrimborUI && this.getCelebrimbor().celebrimborUI !== null) {
            this.getCelebrimbor().celebrimborUI.initUiConditional();
            return this.getCelebrimbor().celebrimborUI;
        }

        if(this.isDebug()) {
            this.console('New instance CelebrimborUI in CelebrimborRecognition', 'info');
        }

        this.getCelebrimbor().celebrimborUI = new CelebrimborUI();

        return this.getCelebrimbor().celebrimborUI;
    }
}