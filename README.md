# Celebrimbor

JavaScript библиотека, позволяющая распознавать и воспроизводить текст, а так же выполнять команды


## Использование

````html
<script type="module" src="../path/to/CelebrimborRecognition.js"></script>
<script>
  let celebrimbor = new CelebrimborRecognition();
  
  // вариант 1
  let commands = {
    'привет': () => { 
        alert('Привет!'); 
    },
    ...
  };

  celebrimbor.addCommands(commands);
  
  // вариант 2
  celebrimbor.addCommands({
     'обнови страницу': () => {
          location.reload();
      }
  });
  
  // вариант 3
  celebrimbor.addCommands({
      'напиши *log и еще *any': printLog
  });
  
  function printLog(log, any) {
     console.log('Я пишу ' + log + ', а также ' + any);
  }
  
  celebrimbor.start();

</script>
````

### Активация говора
Celebrimbor умеет говорить!
````javascript
let speaker = celebrimbor.synthesis();

celebrimbor.addCommands({
    'скажи *say': (say) => {
        speaker.synthesis().say(say);
    }
});
````

а так же отдельное использование

````javascript
let celebrimborSpeaker = new CelebrimborSynthesis();
````
### Активация UI 
Активация графического интерфейса максимальна проста в использовании и составляет всего лишь в пару строк: 

````javascript
let celebrimbor = new CelebrimborUI();
// происходит автоматическая инициализация CelebrimborRecognition

// ... добавление команд и т.д

celebrimbor.render();
````

### События
Celebrimbor поддерживает события для каждой сущности библиотеки и очень просты в использовании:
````javascript

let celebrimbor = new CelebrimborUI();
let speaker = celebrimbor.synthesis();

celebrimbor.addEvent(celebrimbor.getEvents().BEFORE_OFF, (event) => {
   /**
    * @see Celebrimbor.triggerEvent(), addEvent and CelebrimborUI.setStatusOff()
    */
   console.log('Событие до сворачивания ' + event.detail.obj.timestamp);
});

celebrimbor.addEvent(celebrimbor.getEvents().AFTER_OFF, (event) => {
   console.log('Событие после сворачивания');
});

celebrimbor.addEvent(celebrimbor.getEvents().AFTER_SET_STYLESHEET, (event) => {
   speaker.say('Событие на завершение темизации графического интерфейса');
});

// или через глобальные свойства (poperties) объекта Celebrimbor

celebrimbor.addCommands({
    'пауза': () => {
       celebrimbor.pause();
    }
});

celebrimbor.addEvent(celebrimbor.getProps().speech.events.BEFORE_PAUSE, (event) => {
    speaker.say('Вы поcтавили паузу!');
});
````

### Управление скоростью и громкостью
Celebrimbor реализует простенькую возможность кастомизации Synthesis API, пример из документации: 

````javascript
var pitch = document.querySelector('#pitch');
var pitchValue = document.querySelector('.pitch-value');
var rate = document.querySelector('#rate');
var rateValue = document.querySelector('.rate-value');

pitch.onchange = () => {
    speaker.setVolume(pitch.value);
    pitchValue.textContent = pitch.value;
}

rate.onchange = () => {
    speaker.setSpeed(rate.value);
    rateValue.textContent = rate.value;
}
````

### Дополнительные примеры API: 
API еще не полное
````javascript
// помощник, выводит команды на UI интерфейс
celebrimbor.setSampleCommands(['heeey', 'privet']);

// думаю понятно
celebrimbor.setLanguage('ru-RU');
````
