/**
 * 
 */

export class Celebrimbor {
    
    constructor() {
        this.init();
    }
    
    init(options = {}) {
        this.preInit();

        if(this.isDebug()) {
            this.console(this.constructor.name + ' successfully initialized', 'info');
        }
    }
    
    preInit() {
        this.initProps();
        this.detectErrors();
        
        /**
         * Получаем объект speechRecognition, через обработку префиксов браузеров
         */

        if (window.hasOwnProperty('SpeechRecognition')) {
            this.celebrimborSpeech = new window.SpeechRecognition();
        } else if(window.hasOwnProperty('webkitSpeechRecognition')) {
            this.celebrimborSpeech = new window.webkitSpeechRecognition();
        } else if(window.hasOwnProperty('mozSpeechRecognition')) {
            this.celebrimborSpeech = new window.mozSpeechRecognition();
        } else if(window.hasOwnProperty('msSpeechRecognition')) {
            this.celebrimborSpeech = new window.msSpeechRecognition();
        } else if(window.hasOwnProperty('oSpeechRecognition')) {
            this.celebrimborSpeech = new window.oSpeechRecognition();
        }

        if (!this.celebrimborSpeech) {
            this.console('Celebrimbor is not initialized!', 'error');
            return false;
        }
    
        this.initDevice();
    }
    
    initProps() {
        /**
         * @object global Celebrimbor
         */
        this.celebrimbor = {
            properties: {
                debug: true,
                debugStyles: {
                    error: {
                        backround: 'background: #C12127; color: black;',
                        color: 'color:black;'
                    },
                    warn: {
                        backround: '',
                        color: ''
                    },
                    info: {
                        backround: 'background: #4285F4; color: #FFFFFF',
                        color: 'color:black;'
                    },
                    any: {
                        backround: 'background: #005454; color: #BFF8F8',
                        color: 'color:black;'
                    },
                },
                text: {
                    toggleLabelText: 'Активировать управление голосом',
                    listeningInstructionsText: 'Чем я могу Вам помочь?',
                },
                device: {
                    isMobile: false,
                    isDescop: true,
                    isChrome: true,
                    idDevice: null
                },
                redexp: {
                    optionalParam: /\s*\((.*?)\)\s*/g,
                    optionalRegex: /(\(\?:[^)]+\))\?/g,
                    namedParam: /(\(\?)?:\w+/g,
                    splatParam: /\*\w+/g,
                    escapeRegExp: /[\-{}\[\]+?.,\\\^$|#]/g,
                },
                speech: {
                    autoRestart: true,
                    lastStartedAt: 0,
                    autoRestartCount: 0,
                    pauseListening: false,
                    isListening: false,
                    events: {}
                },
                ui: {
                    isInit: false,
                    startCommand: false,
                    abortCommand: false,
                    listeningStoppedTimeout: false,
                    minutesToRememberStatus: 0,
                    guiNodes: false,
                    stylesheet: false,
                    stylesheetNode: false,
                    uiElements: {
                        divRoot: {
                            id: 'celebrimbor-ui',
                            cssClasses: {
                                listen: 'celebrimbor-ui--listening',
                                notListen: 'celebrimbor-ui--not-listening',
                                sampleCommands: 'celebrimbor-ui--sample-commands-shown',
                                sencence: 'celebrimbor-ui--recognized-sentence-shown'
                            }
                        },
                        button: 'celebrimbor-ui-toggle-button',
                        label: 'celebrimbor-ui-toggle-button__label',
                        listen: {
                            divBox: 'celebrimbor-ui-listening-box',
                            divText: 'celebrimbor-ui-listening-text',
                            spanInstructions: 'celebrimbor-ui-listening-text__instructions',
                            spanSamples: 'celebrimbor-ui-listening-text__samples',
                            spanSentence: 'celebrimbor-ui-listening-text__recognized-sentence'
                        }
                    },
                    events: {}
                },
                synthesis: {
                    voices: {},
                    voice: {
                        default: false,
                        lang: "ru-RU",
                        localService: false,
                        name: "Google UK English Male",
                        voiceURI: "Google UK English Male"
                    },
                    helpers: {
                        redirectRecognizedTextOutput: null,
                        remoteProcessorHandler: null,
                        lastSay: null,
                        fatalityPromiseCallback: null
                    },
                    events: {},
                    isSpeaking: false,
                    garbageCollection: [],
                    speed: 1,
                    volume: 1,
                    obeying: true,
                    soundex: false,
                    //continuous: true,
                    name: 'Celebrimbor',
                }
            },
            speechRecognition: false,
            speechRecognitionObject: false,
            speechSynthesis: false,
            celebrimborUI: false,
            commands: [],
            sampleCommands: [],
            recognizedSentences: [],
            displayRecognizedSentence: false,
        };
        
        this.callbacks = {
            start:                  [], 
            error:                  [], 
            end:                    [], 
            soundstart:             [], 
            result:                 [], 
            resultMatch:            [], 
            resultNoMatch:          [], 
            errorNetwork:           [], 
            errorPermissionBlocked: [], 
            errorPermissionDenied:  [] 
        };
    }
    
    initDevice() {
        if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
            this.getProps().device.isMobile = true;
        }
        
        if (navigator.userAgent.indexOf("Chrome") == -1) {
            this.getProps().device.isChrome = false;
        }

        if(this.isDebug()) {
            this.console('Detected device ' + this.getProps().device.isMobile ? 'Mobile' : 'Chrome/Descop');
        }
    }

    /**
     *
     * @param results
     */
    parseResults(results) {
        
        this.invokeCallbacks(this.callbacks.result, results);
        
        let commandText;
        
        // используется только 5 результатов с альтернативными вариациями
        for (let i = 0; i < results.length; i++) {
            
            // текст распознан
            commandText = results[i].trim();
            
            if (this.isDebug()) {
                this.console('Speech recognized: %c' + commandText, 'info');
            }

            // проверка на совместимость распознанного текста с одной из команд в списке
            for (let j = 0, l = this.getCelebrimbor().commands.length; j < l; j++) {
                let currentCommand = this.getCelebrimbor().commands[j];
                let result = currentCommand.command.exec(commandText);
                
                if (result) {
                    let parameters = result.slice(1);

                    if (this.isDebug()) {
                        this.console('command matched: %c' + currentCommand.originalPhrase, 'info');
                        if (parameters.length) {
                            this.console('with parameters', 'info');
                            this.console(parameters, 'info')
                        }
                    }
                    
                    // выполнить команду
                    currentCommand.callback.apply(this, parameters);
                    
                    this.invokeCallbacks(this.callbacks.resultMatch, commandText, currentCommand.originalPhrase, results);
                    
                    return;
                }
            }
        }
        
        this.invokeCallbacks(this.callbacks.resultNoMatch, results);
    };

    /**
     *
     * @param command
     * @param callback
     * @param originalPhrase
     */
    registerCommand(command, callback, originalPhrase) {
        this.celebrimbor.commands.push({
            command: command, 
            callback: callback, 
            originalPhrase: 
            originalPhrase 
        });
        
        if (this.isDebug()) {
            this.console('Command successfully loaded: ' + originalPhrase, 'info');
        }
    };

    /**
     *
     * @param callbacks
     */
    invokeCallbacks (callbacks) {
        let args = [];
        
        for (let _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        callbacks.forEach((callback) => {
            callback.callback.apply(callback.context, args);
        });
    };

    /**
     *
     * @param command
     * @returns {RegExp}
     */
    commandToRegExp(command) {
        let redexp = this.getProps().redexp;
        
        command = command.replace(redexp.escapeRegExp, '\\$&')
            .replace(redexp.optionalParam, '(?:$1)?')
            .replace(redexp.namedParam, (match, optional) => {
                return optional ? match : '([^\\s]+)';
            })
            .replace(redexp.splatParam, '(.*?)').replace(redexp.optionalRegex, '\\s*$1?\\s*');
        
        return new RegExp('^' + command + '$', 'i');
    };

    /**
     *
     * @param message
     * @param type
     */
    console(message, type) {
        let preMessage = 'Celebrimbor';

        if (this.getProps().debug === true) {
            let styles = this.getProps().debugStyles;
            
            switch (type) {
                case 'error':
                    console.log("%c" + preMessage + ":%c " + message, styles.error.backround, styles.error.color);
                    break;
                case 'info':
                    console.log("%c" + preMessage + ":%c " + message, styles.info.backround, styles.info.color);
                    break;
                case 'warn':
                    console.warn(message);
                    break;
                default:
                    console.log("%c" + preMessage + ":%c " + message, styles.any.backround, styles.any.color);
                    break;
            }
        }
    }

    /**
     *
     * @returns {boolean}
     */
    detectErrors() {
        if ((window.location.protocol) == "file:") {      
            this.console('Running Celebrimbor directly from a file. The APIs require a different communication protocol like HTTP or HTTPS', 'error');
            return false;
        }
        
        if (!this.getProps().device.isChrome) {
            this.console('The Speech Recognition and Speech Synthesis APIs require the Google Chrome Browser to work.', 'error');
            return false;
        }
        
        if (window.location.protocol != "https:") {
            this.console('Celebrimbor is being executed using the ' + window.location.protocol + ' protocol. The continuous mode requires a secure protocol (HTTPS)', 'warn');
        }
        
        return true;
    }

    /**
     *
     * @returns {boolean}
     */
    isDebug() {
        return this.getProps().debug !== false;
    }

    /**
     *
     * @param status
     * @returns {boolean}
     */
    setDebug(status) {
        if (status) {
            return this.getProps().debug = true;
        } else {
            return this.getProps().debug = false;
        }
    }

    /**
     *
     * @returns {{properties: {debug: boolean, debugStyles: {error: {backround: string, color: string}, warn: {backround: string, color: string}, info: {backround: string, color: string}, any: {backround: string, color: string}}, text: {toggleLabelText: string, listeningInstructionsText: string}, device: {isMobile: boolean, isDescop: boolean, isChrome: boolean}, redexp: {optionalParam: RegExp, optionalRegex: RegExp, namedParam: RegExp, splatParam: RegExp, escapeRegExp: RegExp}, speech: {autoRestart: boolean, lastStartedAt: number, autoRestartCount: number, pauseListening: boolean, isListening: boolean}, ui: {isInit: boolean, startCommand: boolean, abortCommand: boolean, listeningStoppedTimeout: boolean, minutesToRememberStatus: number, guiNodes: boolean, stylesheet: boolean, stylesheetNode: boolean, uiElements: {divRoot: {id: string, cssClass: string}, button: string, label: string, listen: {divBox: string, divText: string, spanInstructions: string, spanSamples: string, spanSentence: string}}}, synthesis: {voices: {}}}, speechRecognition: null, speechSynthesis: boolean, celebrimborUI: boolean, commands: Array, sampleCommands: Array, recognizedSentences: Array, displayRecognizedSentence: boolean}|*}
     */
    getCelebrimbor() {
        return this.celebrimbor;
    }

    /**
     *
     * @returns {*}
     */
    getProps() {
        return this.getCelebrimbor().properties;
    }

    /**
     * @description вызов событий к документу, вы можете передать параметр { param }, чтобы передать собственные данные
     *
     * @param {string} name
     * @param {*} param
     * @returns {CustomEvent}
     *
     * @see для получения справки по вызову событий и работы с параметрами
     */
    triggerEvent(name, param = null) {
        let event = new CustomEvent(name, {
            detail: {
                obj: param
            }
        });

        document.dispatchEvent(event);

        return event;
    }

    /**
     * @description добавление события к документу, вы можете использовать параметр detail.obj
     *      для получения дополнительных возможностей:
     *
     *      ```js
     *      celebrimbor.addEvent(celebrimbor.getEvents().BEFORE_OFF, (event) => {
     *          alert('Событие до сворачивания ' + event.detail.obj.timestamp);
     *      });
     *      ```
     *  @see Celebrimbor.triggerEvent() для получения справки по инициализации событий
     *
     * @param {String} event
     * @param {callback} callback
     * @param {boolean} use
     */
    addEvent(event, callback, use = false) {
        document.addEventListener(event, (e) => {
            callback(e);
        }, use);
    }

    /**
     * @description возвращает события конкретного инстанса
     * @returns {*}
     */
    getEvents() {
        let instace, events;

        if(this.constructor.name === 'CelebrimborRecognition') {
            instace = 'CelebrimborRecognition';
            events = this.getProps().speech.events;
        } else if(this.constructor.name === 'CelebrimborUI') {
            instace = 'CelebrimborUI';
            events = this.getProps().ui.events;
        } else if(this.constructor.name === 'CelebrimborSynthesis') {
            instace = 'CelebrimborSynthesis';
            events = this.getProps().synthesis.events;
        }

        if(this.isDebug()) {
            this.console('Events instanceof ' + instace, 'info');
        }

        return events;
    }
}