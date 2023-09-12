import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, SafeAreaView, Button, TouchableOpacity, Alert, FlatList, ScrollView, SectionList, Pressable } from 'react-native';
import React, { useState, setState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import wordList from './assets/json/wordlist.json';

import correctSFX from './assets/sfx/short03b.wav';
import wrongSFX from './assets/sfx/short02c.wav';

export default function App() {

  // Check for our current game mode.
  const [currentGameMode, setCurrentGameMode] = useState('');

  // States for our word prompts.
  const [casualWord, setCasualWord] = useState('');
  const [scoreModeWord, setScoreModeWord] = useState('');
  const [challengeModeWord, setChallengeModeWord] = useState('');

  // States for our word inputs.
  const [inputWord, setInputWord] = useState('');

  // States for our game scores for each game mode.
  const [casualScore, setCasualScore] = useState(0);
  const [score, setScore] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);

  // States for our high scores for each game mode.
  const [highScore, setHighScore] = useState(0);
  const [challengeHighScore, setChallengeHighScore] = useState(0);

  // States to check if a game is currently on progress.
  const [scoreModeGameStarted, setScoreModeGameStarted] = useState('false');
  const [challengeModeGameStarted, setChallengeModeGameStarted] = useState('false');

  // States to contain all of our words that has been used for that round.
  const [casualWordUsedList, setCasualWordUsedList] = useState([]);
  const [scoreWordUsedList, setScoreWordUsedList] = useState([]);
  const [challengeWordUsedList, setChallengeWordUsedList] = useState([]);

  // State for minimum length for challenge mode.
  const [minimumLength, setMinimumLength] = useState(0);

  // States to contain all words that has been used while opening this game.
  const [wordHistoryList, setWordHistoryList] = useState([]);

  // States for checking if function still loads or not.
  const [isLoading, setLoading] = useState(true);

  // State to contain the JSON retrieved from the API.
  const [wordDefinition, setWordDefinition] = useState([]);

  // States for sound effects.
  const [sound, setSound] = useState();

  // States for error flags.
  const [usedWordFlag, setUsedWordFlag] = useState(false);
  const [nonExistingWordFlag, setNonExistingWordFlag] = useState(false);
  const [invalidWordFlag, setInvalidWordFlag] = useState(false);
  const [emptyTextFlag, setEmptyTextFlag] = useState(false);
  const [textTooShortFlag, setTextTooShortFlag] = useState(false);

  // State for checking if the player is in casual mode or not.
  const [isCasualMode, setIsCasualMode] = useState(true);

  // State for checking lives the player has.
  const [lives, setLives] = useState(5);
  const [challengeLives, setChallengeLives] = useState(3);

  // Create a stack navigator for our application.
  const Stack = createStackNavigator();

  // Create an input Ref
  const inputRef = useRef(null);

  // Load the high scores stored in the AsyncStorage. 
  async function getHighScoreFromAsync() {

    try {
      const highScoreValue = await AsyncStorage.getItem('highScore');
      const challengeHighScoreValue = await AsyncStorage.getItem('challengeHighScore');

      if (highScoreValue !== null) {
        setHighScore(highScoreValue);
      }

      if (challengeHighScoreValue !== null) {
        setChallengeHighScore(challengeHighScoreValue);
      }


    }

    catch (error) {
      console.log('Error occurred while loading data: ', error);
    }

  }

  // Save the high score into AsyncStorage.
  const storeHighScore = async (value) => {

    switch (currentGameMode) {
      case 'Score':
        try {
          await AsyncStorage.setItem('highScore', value);
        }
        catch (error) {
          Alert('There was an error while saving the high score: ' + error);
        }

      case 'Challenge':
        try {
          await AsyncStorage.setItem('challengeHighScore', value);
        }
        catch (error) {
          Alert('There was an error while saving the high score: ' + error);
        }

    }

  }

  // Load the word history list stored in the AsyncStorage.
  async function getWordHistoryListFromAsync() {

    try {
      const wordHistoryListRetrieved = await AsyncStorage.getItem('wordHistoryList');

      if (wordHistoryListRetrieved !== null) {

        const JSONValue = JSON.parse(wordHistoryListRetrieved);
        setWordHistoryList(JSONValue);

      }

    }

    catch (error) {
      console.log('Error occurred while loading data: ', error);
    }

  }

  // Save the word history list into the AsyncStorage.
  const storeWordHistoryList = async (value) => {
    try {
      console.log(value);
      const JSONList = JSON.stringify(value);
      await AsyncStorage.setItem('wordHistoryList', JSONList);
    }

    catch
    {
      Alert('There was an error while updating the word list: ' + error);
    }

  }

  // Randomize the starting word prompts for all modes.
  useEffect(() => {
    casualWord == setCasualWord(wordList.words[Math.floor(Math.random() * wordList.words.length)]);
    scoreModeWord == setScoreModeWord(wordList.words[Math.floor(Math.random() * wordList.words.length)]);
    challengeModeWord == setChallengeModeWord(wordList.words[Math.floor(Math.random() * wordList.words.length)]);

    getHighScoreFromAsync();
    getWordHistoryListFromAsync();
  }, []);

  // Play a sound for valid words.
  async function playSound() {

    const { sound } = await Audio.Sound.createAsync(correctSFX);

    setSound(sound);

    await sound.playAsync();
  }

  // Play a sound for invalid words.
  async function playErrorSound() {

    const { sound } = await Audio.Sound.createAsync(wrongSFX);

    setSound(sound);

    await sound.playAsync();
  }

  // Unload the sound after usage.
  React.useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  // Function to calculate the score based on the word sent.
  function calculateScore(word) {

    var characters = word.split("");
    var scoreCalculation = 0;

    characters.map(character => {

      if (character == 'e' || character == 'a' || character == 'i' || character == 'o' || character == 'n' || character == 'r' ||
        character == 't' || character == 'l' || character == 's' || character == 'u') {
        scoreCalculation = scoreCalculation + 1;
      }

      if (character == 'd' || character == 'g') {
        scoreCalculation = scoreCalculation + 2;
      }

      if (character == 'b' || character == 'c' || character == 'm' || character == 'p') {
        scoreCalculation = scoreCalculation + 3;

      }

      if (character == 'f' || character == 'h' || character == 'v' || character == 'w' || character == 'y') {
        scoreCalculation = scoreCalculation + 4;

      }

      if (character == 'k') {
        scoreCalculation = scoreCalculation + 5;

      }

      if (character == 'j' || character == 'x') {
        scoreCalculation = scoreCalculation + 8;

      }

      if (character == 'q' || character == 'z') {
        scoreCalculation = scoreCalculation + 10;

      }

    })


    switch (currentGameMode) {
      case 'Casual':
        setCasualScore(casualScore + scoreCalculation);
        break;

      case 'Score':
        setScore(score + scoreCalculation);
        break;

      case 'Challenge':
        setChallengeScore(challengeScore + scoreCalculation);
        break;
    }


  }

  // Function to check the word inputted.
  function checkLetter(input_word) {

    // Get the first input letter.
    const firstInputLetter = input_word.charAt(0).toLowerCase();

    {/* Check the current mode the user is in to obtain the last letter of the prompt in the current mode. */ }

    switch (currentGameMode) {

      case 'Casual':
        lastLetter = casualWord.slice(-1).toLowerCase();
        wordListCheck = casualWordUsedList;
        break;

      case 'Score':
        lastLetter = scoreModeWord.slice(-1).toLowerCase();
        wordListCheck = scoreWordUsedList;
        break;

      case 'Challenge':
        lastLetter = challengeModeWord.slice(-1).toLowerCase();
        wordListCheck = challengeWordUsedList;
        break;

    }

    {/* Checks if the last letter of the prompt matches the first letter of the inputted word. */ }
    if (lastLetter == firstInputLetter) {

      {/* Checks if the word is in the word list. */ }
      if (wordList.words.includes(input_word.toLowerCase()) == true) {

        {/* Check if the word has been used already. */ }
        {/* If not, the word is a valid word. */ }
        if (wordListCheck.some((wordUsedListWords) => wordUsedListWords.word.includes(input_word.toLowerCase()))) {

          {/* Set the error flag for the used word warning. */ }
          setUsedWordFlag(true);

          {/* Remove the flag after 1000 ms. */ }
          setTimeout(() => {
            setUsedWordFlag(false);
          }, 1000);

          {/* Reduce the player's life by one if they're not on casual mode. */ }
          lifeCheck();

          {/* Play a sound effect notifying a valid word has already been used. */ }
          playErrorSound();

          {/* Cleans the input text. */ }
          setInputWord("");

        }

        else {

          // Check if the word meets the minimum length and IS currently in challenge mode.
          if (input_word.length < minimumLength && currentGameMode == 'Challenge') {

            {/* Set the error flag for the used word warning. */ }
            setTextTooShortFlag(true);

            {/* Remove the flag after 1000 ms. */ }
            setTimeout(() => {
              setTextTooShortFlag(false);
            }, 1000);

            {/* Reduce the player's life by one if they're not on casual mode. */ }
            lifeCheck();

            {/* Play a sound effect notifying a valid word has already been used. */ }
            playErrorSound();

            {/* Cleans the input text. */ }
            setInputWord("");

          }

          else {

            {/* Replace the prompted word with the inputted word and lowercased for consistency with the prompts. */ }
            switch (currentGameMode) {

              case "Casual":
                setCasualWord(input_word.toLowerCase());
                break;

              case "Score":
                setScoreModeWord(input_word.toLowerCase());
                break;

              case "Challenge":
                setChallengeModeWord(input_word.toLowerCase());
                break;

            }

            {/* Play a sound effect notifying a valid word. */ }
            playSound();

            {/* Text input is cleared and add the word to a list of already used words. */ }
            setInputWord("");

            {/* Add the inputted word to the used word list depending on the mode currently and calculate score. */ }
            {/* Add the used word to the history of words. */ }

            switch (currentGameMode) {

              case "Casual":

                setCasualWordUsedList([...casualWordUsedList, { word: input_word.toLowerCase() }]);
                calculateScore(input_word);

                // Add the word used in the word history list if it's not already in the list.
                if (wordHistoryList.some((wordHistoryListWords) => wordHistoryListWords.word.includes(input_word.toLowerCase()))) {

                }

                else {
                  setWordHistoryList([...wordHistoryList, { word: input_word.toLowerCase() }]);

                  // Save the word history list to AsyncStorage.
                  storeWordHistoryList(wordHistoryList);
                }
                break;

              case "Score":

                setScoreWordUsedList([...scoreWordUsedList, { word: input_word.toLowerCase() }]);
                calculateScore(input_word);

                // Add the word used in the word history list if it's not already in the list.
                if (wordHistoryList.some((wordHistoryListWords) => wordHistoryListWords.word.includes(input_word.toLowerCase()))) {

                }

                else {
                  setWordHistoryList([...wordHistoryList, { word: input_word.toLowerCase() }]);

                  // Save the word history list to AsyncStorage.
                  storeWordHistoryList(wordHistoryList);
                }

                break;

              case "Challenge":

                // Re-randomize the length of words.
                setMinimumLength(Math.floor(3 + Math.random() * 3));

                setChallengeWordUsedList([...challengeWordUsedList, { word: input_word.toLowerCase() }]);
                calculateScore(input_word);

                // Add the word used in the word history list if it's not already in the list.
                if (wordHistoryList.some((wordHistoryListWords) => wordHistoryListWords.word.includes(input_word.toLowerCase()))) {

                }

                else {
                  setWordHistoryList([...wordHistoryList, { word: input_word.toLowerCase() }]);

                  // Save the word history list to AsyncStorage.
                  storeWordHistoryList(wordHistoryList);
                }

                break;

            }


          }

        }

      }

      else {

        {/* Set the error flags for the non-existing word warning. */ }
        setNonExistingWordFlag(true);

        {/* Reduce the player's life by one if they're not on casual mode. */ }
        lifeCheck();

        {/* Remove the flag after 1000 ms. */ }
        setTimeout(() => {
          setNonExistingWordFlag(false);
        }, 1000);

        {/* Play a sound effect notifying a valid word has already been used. */ }
        playErrorSound();

        {/* Cleans the input text. */ }
        setInputWord("");

      }

    }

    else {

      {/* Set the error flag for the invalid word warning. */ }
      setUsedWordFlag(false);
      setNonExistingWordFlag(false);
      setInvalidWordFlag(true);
      setEmptyTextFlag(false);

      {/* Reduce the player's life by one if they're not on casual mode. */ }
      lifeCheck();

      {/* Remove the flag after 1000 ms. */ }
      setTimeout(() => {
        setInvalidWordFlag(false);
      }, 1000);

      {/* Play a sound effect notifying a valid word has already been used. */ }
      playErrorSound();

      {/* Cleans the input text. */ }
      setInputWord("");

    }

  }

  // Function for reducing the player's life count and display game over screen.
  function lifeCheck() {

    switch (currentGameMode) {
      case 'Score':
        if (lives != 0) {
          setLives(lives - 1);
        }
        break;

      case 'Challenge':
        if (challengeLives != 0) {
          setChallengeLives(challengeLives - 1);
        }
        break;
    }

  }

  // Reset certain variables and re-randomize the word prompt for a fresh state of game.
  function newGamePreparation() {

    // Reset scores and word used list depending on the game mode currently.
    switch (currentGameMode) {
      case 'Casual':
        setCasualScore(0);
        setCasualWordUsedList([]);
        casualWord == setCasualWord(wordList.words[Math.floor(Math.random() * wordList.words.length)]);
        break;

      case 'Score':
        setLives(5);
        setScore(0);
        setScoreWordUsedList([]);
        scoreModeWord == setScoreModeWord(wordList.words[Math.floor(Math.random() * wordList.words.length)]);
        break;

      case 'Challenge':
        setChallengeLives(3);
        setChallengeScore(0);
        setChallengeWordUsedList([]);
        challengeModeWord == setChallengeModeWord(wordList.words[Math.floor(Math.random() * wordList.words.length)]);
        break;

    }

  }

  // Function for virtual keyboard for the game.
  function VirtualKeyboard() {

    // Create a navigation hook.
    const navigation = useNavigation();

    // Check for game over if the user's life reaches 0.
    useEffect(() => {

      if (challengeLives == 0) {
        navigation.navigate('GameOver');
      }

    }, [challengeLives])

    useEffect(() => {

      if (lives == 0) {
        navigation.navigate('GameOver');
      }

    }, [lives])

    return (

      <View style={styles.virtualKeyboardContainer}>

        {/* QWERTY row */}
        <View style={{ flexDirection: 'row' }}>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'q'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>q</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'w'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>w</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'e'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>e</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'r'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>r</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 't'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>t</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'y'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>y</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'u'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>u</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'i'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>i</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'o'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>o</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'p'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>p</Text>
          </TouchableOpacity>

        </View>

        {/* ASDFGHJKL row */}
        <View style={{ flexDirection: 'row' }}>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'a'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>a</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 's'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>s</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'd'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>d</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'f'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>f</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'g'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>g</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'h'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>h</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'j'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>j</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'k'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>k</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'l'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>l</Text>
          </TouchableOpacity>


        </View>

        {/* ZXCVBNM row */}
        <View style={{ flexDirection: 'row' }}>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'z'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>z</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'x'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>x</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'c'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>c</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'v'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>v</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'b'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>b</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'n'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>n</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setInputWord(inputWord + 'm'); }} style={styles.virtualKeyboardButton}>
            <Text style={styles.virtualKeyboardLetter}>m</Text>
          </TouchableOpacity>

        </View>

        {/* CLEAR and ENTER row*/}
        <View style={{ flexDirection: 'row' }}>

          <TouchableOpacity onPress={() => { setInputWord(''); }} style={styles.virtualKeyboardFunctionalButton}>
            <Text style={styles.virtualKeyboardLetter}>CLEAR</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {

            if (inputWord.trim() == "") {
              // Set the empty text flag.
              setEmptyTextFlag(true);

              // Set the flag to false after 1000 ms.
              setTimeout(() => {
                setEmptyTextFlag(false);
              }, 1000);

              // Play a sound to notify the user made a mistake.
              playErrorSound();

              // Reduce the player's life by one if they're not on casual mode.
              if (isCasualMode == false) {
                lifeCheck();
              }

            }
            else {

              checkLetter(inputWord);

            }


          }} style={styles.virtualKeyboardFunctionalButton}>
            <Text style={styles.virtualKeyboardLetter}>ENTER</Text>
          </TouchableOpacity>

        </View>

      </View>

    )
  }

  // Function to display the lives for score mode.
  function scoreLifeDisplay()
  {
    return (
      <View>
        <Text>Chances left: {lives}</Text>
      </View>
      
    )
  }

  // Function to fetch the definition of words via Dictionary API
  const fetchWordDefinition = async (word) => {

    let word_query = word;
    url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word_query}`;

    try {
      const response = await fetch(url);
      const wordDefinitionJSON = await response.json();

      setWordDefinition(wordDefinitionJSON);

    }
    catch (error) {
      console.log(error);
    }
    finally {
      setLoading(false);
    }

  }


  // Screen for home screen.
  function HomeScreen() {

    // Create a navigation hook.
    const navigation = useNavigation();

    return (
      <SafeAreaView>

        <View>

          <View style={styles.homeScreenTitleContainer}>
            <Text style={styles.homeScreenTitleText}>Connected by Letters</Text>
          </View>

          {/* Button to redirect to the casual mode of the game. */}
          <View style={{ backgroundColor: '#73c25f', padding: 5, marginBottom: 5 }}>

            <TouchableOpacity onPress={() => {
              //Set the current game mode.
              setCurrentGameMode('Casual');

              // Disable the life system.
              setIsCasualMode(true);

              // Redirect to the game.
              navigation.navigate('CasualMode');

            }}
              style={styles.homeScreenModeButton}>

              <Text style={styles.homeScreenModeText}>Casual Mode</Text>
              <Text style={styles.homeScreenModeSubtitle}>Practice your word chains! Reset to your liking.</Text>
            </TouchableOpacity>

          </View>

          {/* Button to redirect to the score mode of the game. */}
          <View style={{ backgroundColor: '#b2c631', padding: 5, marginBottom: 5 }}>

            <TouchableOpacity onPress={() => {

              // Check if a game is currently in progress.
              if (scoreModeGameStarted == true) {
                Alert.alert('Warning!', 'Do you wish to create a new game or continue the game?', [

                  {
                    text: 'Continue game',
                    onPress: () => {

                      //Set the current game mode and use the life system.
                      setCurrentGameMode('Score');
                      setIsCasualMode(false);
                      navigation.navigate('ScoreMode');

                    }
                  },

                  {
                    text: 'Reset game',
                    onPress: () => {

                      newGamePreparation();

                      // Allow the game to use life system.
                      setIsCasualMode(false);

                      // Redirect to the game and set the current game mode.
                      setCurrentGameMode('Score');
                      //setIsCasualMode(false);
                      navigation.navigate('ScoreMode');

                    }
                  }

                ])
              }

              else {

                // Redirect to the game.
                setCurrentGameMode('Score');
                setScoreModeGameStarted(true);
                setIsCasualMode(false);
                navigation.navigate('ScoreMode');

              }

            }}
              style={styles.homeScreenModeButton}>
              <Text style={styles.homeScreenModeText}>Score Mode</Text>
              <Text style={styles.homeScreenModeSubtitle}>Best Score: {highScore}</Text>
            </TouchableOpacity>

          </View>

          {/* Button to redirect to the challenge mode of the game. */}
          <View style={{ backgroundColor: '#ca6049', padding: 5, marginBottom: 5 }}>

            <TouchableOpacity onPress={() => {

              // Check if a game is currently in progress.
              if (challengeModeGameStarted == true) {
                Alert.alert('Warning!', 'Do you wish to create a new game or continue the game?', [

                  {
                    text: 'Continue game',
                    onPress: () => {

                      //Set the current game mode and use the life system.
                      setCurrentGameMode('Challenge');
                      setIsCasualMode(false);
                      navigation.navigate('ChallengeMode');

                    }
                  },

                  {
                    text: 'Reset game',
                    onPress: () => {

                      newGamePreparation();

                      // Allow the game to use life system.
                      setIsCasualMode(false);

                      // Re-randomize the minimum length.
                      setMinimumLength(Math.floor(3 + Math.random() * 3));

                      // Redirect to the game and set the current game mode.
                      setCurrentGameMode('Challenge');
                      setIsCasualMode(false);
                      navigation.navigate('ChallengeMode');

                    }
                  }

                ])
              }

              else {

                // Redirect to the game.
                setCurrentGameMode('Challenge');
                setChallengeModeGameStarted(true);
                setIsCasualMode(false);

                // Randomize the minimum length of word.
                setMinimumLength(Math.floor(3 + Math.random() * 3));

                navigation.navigate('ChallengeMode');

              }

            }}
              style={styles.homeScreenModeButton}>
              <Text style={styles.homeScreenModeText}>Challenge Mode</Text>
              <Text style={styles.homeScreenModeSubtitle}>Best Score: {challengeHighScore}</Text>
            </TouchableOpacity>

          </View>

          {/* Button to redirect to the game instruction screen. */}
          <View style={{ backgroundColor: '#bbb', padding: 5, marginBottom: 5 }}>

            <TouchableOpacity onPress={() => alert('Coming soon!')} style={styles.homeScreenModeButton}>
              <Text style={styles.homeScreenModeText}>How to Play</Text>
              <Text style={styles.homeScreenModeSubtitle}>Learn how to play the game!</Text>
            </TouchableOpacity>

          </View>

          {/* Button to redirect to the history of word used by the user. */}
          <View style={{ backgroundColor: '#a1bbd7', padding: 5, marginBottom: 5 }}>

            <TouchableOpacity onPress={() => {

              navigation.navigate("WordHistory");

            }}
              style={styles.homeScreenModeButton}>
              <Text style={styles.homeScreenModeText}>Word History</Text>
              <Text style={styles.homeScreenModeSubtitle}>See words you use and learn what they mean.</Text>
            </TouchableOpacity>

          </View>


          <StatusBar style="auto" />

        </View>
      </SafeAreaView>

    )
  }

  // Screen for casual mode.
  function CasualModeScreen() {

    // Create a navigation hook.
    const navigation = useNavigation();

    return (
      <SafeAreaView style={styles.casualModeGameContainer}>

        <Text style={styles.modeTitleText}>Casual Mode</Text>

        <View style={styles.casualModeTitleContainer}>

          {/* Return button. */}
          <TouchableOpacity onPress={() => {
            navigation.navigate('Home')
          }}
            style={styles.casualModeReturnButton}>
            <Text style={styles.casualModeReturnButtonText}>Return</Text>
          </TouchableOpacity>

          <Text style={styles.modeTitleScore}>{casualScore}</Text>

        </View>

        {/* Error text display for the users. */}
        <View style={styles.casualModeTitleContainer}>

          <Text></Text>

          {usedWordFlag == true &&
            <Text style={styles.errorText}>You've already used the word! </Text>
          }

          {nonExistingWordFlag == true &&
            <Text style={styles.errorText}>That word does not exist in the word list. </Text>
          }

          {invalidWordFlag == true &&
            <Text style={styles.errorText}>Wrong first letter! </Text>
          }

          {emptyTextFlag == true &&
            <Text style={styles.errorText}>You can't submit an empty text!</Text>
          }

          <Text></Text>

        </View>

        {/* Reset button. */}
        <TouchableOpacity onPress={() => {
          Alert.alert('Warning!', 'Do you wish to reset?', [

            {
              text: 'Yes',
              onPress: () => {

                setInputWord('');
                newGamePreparation();

              }
            },

            {
              text: 'No',
              onPress: () => {

              }
            }

          ])

        }}
          style={styles.casualModeResetButton}>
          <Text style={styles.casualModeResetButtonText}>Reset</Text>
        </TouchableOpacity>

        {/* Prompt text display. */}
        <View style={styles.gameplayContainer}>

          <Text style={styles.casualWordPrompt}>{casualWord}</Text>

        </View>

        <Text style={styles.modeInputText}>{inputWord}</Text>

        {/* Keyboard for users. */}
        {VirtualKeyboard()}

        <StatusBar style="auto" />

      </SafeAreaView>
    )
  }

  // Screen for score mode.
  function ScoreModeScreen() {

    // Create a navigation hook.
    const navigation = useNavigation();

    return (
      <SafeAreaView style={styles.scoreModeGameContainer}>

        <Text style={styles.modeTitleText}>Score Mode</Text>

        <View style={styles.scoreModeTitleContainer}>


          {/* Return button. */}
          <TouchableOpacity onPress={() => {
            navigation.navigate('Home')
          }}
            style={styles.casualModeReturnButton}>
            <Text style={styles.casualModeReturnButtonText}>Return</Text>
          </TouchableOpacity>

          <Text style={styles.modeTitleScore}>{score}</Text>


        </View>

        {/* Error text display for the users. */}
        <View style={styles.scoreModeTitleContainer}>

          <Text></Text>


          {usedWordFlag == true &&
            <Text style={styles.errorText}>You've already used the word! </Text>
          }

          {nonExistingWordFlag == true &&
            <Text style={styles.errorText}>That word does not exist in the word list. </Text>
          }

          {invalidWordFlag == true &&
            <Text style={styles.errorText}>Wrong first letter! </Text>
          }

          {emptyTextFlag == true &&
            <Text style={styles.errorText}>You can't submit an empty text!</Text>
          }

          <Text></Text>

        </View>

        {/* Life display. */}
        {scoreLifeDisplay()}

        {/* Prompt text display. */}
        <View style={styles.gameplayContainer}>

          <Text style={styles.scoreModeWordPrompt}>{scoreModeWord}</Text>

        </View>


        <Text style={styles.modeInputText}>{inputWord}</Text>

        {/* Keyboard for users. */}
        {VirtualKeyboard()}

        <StatusBar style="auto" />

      </SafeAreaView>
    )
  }

  // Screen for challenge mode.
  function ChallengeModeScreen() {

    // Create a navigation hook.
    const navigation = useNavigation();

    return (
      <SafeAreaView style={styles.challengeModeGameContainer}>

        <Text style={styles.modeTitleText}>Challenge Mode</Text>

        <View style={styles.challengeModeTitleContainer}>

          {/* Return button. */}
          <TouchableOpacity onPress={() => {
            navigation.navigate('Home')
          }}
            style={styles.casualModeReturnButton}>
            <Text style={styles.casualModeReturnButtonText}>Return</Text>
          </TouchableOpacity>

          <Text style={styles.modeTitleScore}>{challengeScore}</Text>


        </View>

        {/* Error text display for the users. */}
        <View style={styles.challengeModeTitleContainer}>

          <Text></Text>


          {usedWordFlag == true &&
            <Text style={styles.errorText}>You've already used the word! </Text>
          }

          {nonExistingWordFlag == true &&
            <Text style={styles.errorText}>That word does not exist in the word list. </Text>
          }

          {invalidWordFlag == true &&
            <Text style={styles.errorText}>Wrong first letter! </Text>
          }

          {emptyTextFlag == true &&
            <Text style={styles.errorText}>You can't submit an empty text!</Text>
          }

          {textTooShortFlag == true &&
            <Text style={styles.errorText}>Your text is too short!</Text>
          }

          <Text></Text>

        </View>

        {/* Prompt text display. */}
        <View style={styles.gameplayContainer}>

          <Text style={styles.challengeModeWordPrompt}>{challengeModeWord}</Text>
          <Text style={styles.challengeModeWordLengthPrompt}>YOUR MINIMUM LENGTH IS: {minimumLength} </Text>

        </View>

        <Text>Chances left: {challengeLives}</Text>

        <Text style={styles.modeInputText}>{inputWord}</Text>

        {/* Keyboard for users. */}
        {VirtualKeyboard()}

        <StatusBar style="auto" />

      </SafeAreaView>
    )


  }

  // Screen for game over.
  function GameOverScreen() {

    // Create a navigation hook.
    const navigation = useNavigation();

    // Create variables for scores and highscores
    var displayScoreResults;
    var displayHighScoreResults;

    useEffect(() => {

      switch (currentGameMode) {
        case 'Score':
          setScoreModeGameStarted(false);
          break;

        case 'Challenge':
          setChallengeModeGameStarted(false);
          break;
      }

    }, []);

    // Get the scores of a specific game mode.
    switch (currentGameMode) {
      case 'Score':
        displayScoreResults = score;
        displayHighScoreResults = highScore;
        break;

      case 'Challenge':
        displayScoreResults = challengeScore;
        displayHighScoreResults = challengeHighScore;
        break;


    }

    useEffect(() => {

      // Replace the high score with the current score if the current score is higher than record.
      if (displayScoreResults > displayHighScoreResults) {

        switch (currentGameMode) {
          case 'Score':
            setHighScore(displayScoreResults);
            storeHighScore(displayScoreResults.toString());
            break;

          case 'Challenge':
            setChallengeHighScore(displayScoreResults);
            storeHighScore(displayScoreResults.toString());
            break;
        }

        displayHighScoreResults = displayScoreResults;
      }

    }, [])

    return (
      <SafeAreaView style={styles.container}>

        <View>
          <Text>Game over!</Text>
          <Text>Score: {displayScoreResults}</Text>
          <Text>High Score: {displayHighScoreResults}</Text>

          {/* Button to go back to the home page. */}
          <Button onPress={() => {

            newGamePreparation();

            navigation.navigate('Home');

          }} title='Return'></Button>
        </View>

      </SafeAreaView>

    )
  }

  // Component for words in the word history list.
  function Word({ item }) {

    // Create a navigation hook.
    const navigation = useNavigation();

    return (
      <View style={styles.wordHistoryContainer}>

        <TouchableOpacity onPress={() => {
          fetchWordDefinition(item.word);
          navigation.navigate('WordDefinition', { text: item.word });
        }}
          style={styles.wordHistoryButton}>
          <Text style={styles.wordHistoryText}>{item.word}</Text>
        </TouchableOpacity>

      </View>
    )

  }

  // Screen for word history and look up feature.
  function WordHistoryScreen() {

    // Create a navigation hook.
    const navigation = useNavigation();

    return (

      <SafeAreaView style={styles.historyListContainer}>

        <Pressable style={styles.wordDefinitionReturnButton}
          onPress={() => {
            setWordDefinition([]);
            navigation.navigate('Home');
          }}>

          <Text style={styles.wordDefinitionReturnButtonText}>Return to Home</Text>

        </Pressable>

        <Text style={styles.historyListHeaderText}>Word History</Text>

        <FlatList
          data={wordHistoryList}
          renderItem={({ item }) => <Word item={item} />}
        />


      </SafeAreaView>

    )
  }

  // Screen for word definition.
  function WordDefinitionScreen({ route }) {

    // Create a navigation hook.
    const navigation = useNavigation();

    // Get the word
    const { text } = route.params;

    return (
      <SafeAreaView style={styles.wordDefinitionContainer}>

        <Pressable style={styles.wordDefinitionReturnButton}
          onPress={() => {
            setWordDefinition([]);
            navigation.navigate('WordHistory');
          }}>

          <Text style={styles.wordDefinitionReturnButtonText}>Return to Word History</Text>

        </Pressable>

        <View style={styles.wordDefinitionTitleContainer}>
          <Text style={styles.wordDefinitionHeaderText}>{text}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator />
        ) : (

          <FlatList
            initialNumToRender={100}
            maxToRenderPerBatch={100}
            style={styles.wordDefinitionDetailsContainer}
            data={wordDefinition}
            renderItem={({ item }) => (
              <View>

                <Text style={styles.wordHistoryHeaderText}>{item.phonetic + '\n'}</Text>

                {/* Loop through the part of speeches. */}
                <FlatList
                  data={item.meanings}
                  renderItem={({ item }) => (
                    <View>

                      <Text style={styles.wordHistoryHeaderText}>{item.partOfSpeech}</Text>

                      {/* Get the definition after rendering the part of speech the word is used. */}
                      <FlatList
                        data={item.definitions}
                        renderItem={({ item }) => (
                          <Text>{`\u2022`} {item.definition} {`\n`}</Text>
                        )}
                      />

                    </View>

                  )}
                />

                <View style={styles.divider}></View>

              </View>

            )
            }
          />

        )}

      </SafeAreaView>
    )

  }

  // Display the home screen and loads the necessary screen for the application.
  return (

    <NavigationContainer>
      <Stack.Navigator screenOptions={{ gestureEnabled: false, headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CasualMode" component={CasualModeScreen} />
        <Stack.Screen name="ScoreMode" component={ScoreModeScreen} />
        <Stack.Screen name="ChallengeMode" component={ChallengeModeScreen} />
        <Stack.Screen name="GameOver" component={GameOverScreen} />
        <Stack.Screen name="WordHistory" component={WordHistoryScreen} />
        <Stack.Screen name="WordDefinition" component={WordDefinitionScreen} />
      </Stack.Navigator>
    </NavigationContainer>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',

  },

  homeScreenTitleContainer: {

    margin: 10,

  },

  homeScreenTitleText: {
    fontSize: 36,
    fontWeight: 'bold',
  },

  homeScreenModeButton: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    height: 110,

  },

  homeScreenModeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,

  },

  homeScreenModeSubtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },

  historyListContainer:
  {
    flex: 1,
    backgroundColor: '#a1bbd7',
    alignItems: 'center',
  },

  historyListHeaderText:
  {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,

  },

  wordHistoryContainer:
  {
    alignItems: 'center',
    width: 300,
  },

  wordHistoryHeaderText:
  {
    fontSize: 16,
    fontWeight: 'bold'
  },

  wordHistoryButton:
  {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    marginBottom: 10,
    width: '80%',
  },

  wordHistoryText:
  {
    fontSize: 18,
    fontWeight: 'bold',
  },

  wordDefinitionReturnButton:
  {
    margin: 20,
    backgroundColor: '#6f8fb1',
    alignSelf: 'center',
    padding: 15,
    margin: 20,
  },

  wordDefinitionReturnButtonText:
  {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },

  wordDefinitionContainer:
  {
    flex: 1,
    backgroundColor: '#a1bbd7',
  },

  wordDefinitionTitleContainer:
  {
    backgroundColor: '#475e93',
    margin: 10,
    padding: 10,
  },

  wordDefinitionHeaderText:
  {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },

  wordDefinitionDetailsContainer:
  {
    backgroundColor: '#7991c6',
    margin: 10,
    padding: 10,
  },

  divider:
  {
    borderBottomColor: 'black',
    borderBottomWidth: 2,
    margin: 10,
    marginBottom: 10,
  },

  virtualKeyboardContainer:
  {
    flex: 1,
    alignItems: 'center',
  },

  virtualKeyboardButton: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    margin: 3,
    marginBottom: 30,
    width: 34,

  },

  virtualKeyboardFunctionalButton: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    margin: 5,
    marginBottom: 30,

  },

  virtualKeyboardLetter: {

    fontSize: 15,
    fontWeight: 'bold',

  },

  casualModeGameContainer:
  {
    flex: 1,
    backgroundColor: '#73c25f',
    alignItems: 'center',
  },

  casualModeTitleContainer:
  {
    backgroundColor: '#478e35',
    width: '100%',
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    marginTop: 10,
    margin: 10,
    height: 55,
  },

  casualModeResetButton:
  {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 5,
    padding: 10,
    margin: 5,

  },

  casualModeReturnButton:
  {
    alignItems: 'center',
    borderRadius: 5,
    padding: 10,
    margin: 5,

  },

  casualModeReturnButtonText:
  {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },

  casualModeResetButtonText:
  {
    fontSize: 18,
    fontWeight: 'bold',
  },

  casualWordPrompt: {
    fontSize: 30,
    fontWeight: 'bold',
    backgroundColor: 'green',
    width: 300,
    textAlign: 'center',
    padding: 15,
    color: 'white',
  },

  scoreModeGameContainer:
  {
    flex: 1,
    backgroundColor: '#b2c631',
    alignItems: 'center',
  },

  scoreModeTitleContainer:
  {
    backgroundColor: '#919f34',
    width: '100%',
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    marginTop: 10,
    margin: 10,
    height: 55,
  },

  scoreModeWordPrompt: {
    fontSize: 30,
    fontWeight: 'bold',
    backgroundColor: '#6c733e',
    width: 300,
    textAlign: 'center',
    padding: 15,
    color: 'white',
  },

  challengeModeGameContainer:
  {
    flex: 1,
    backgroundColor: '#ca6049',
    alignItems: 'center',
  },

  challengeModeTitleContainer:
  {
    backgroundColor: '#9f3923',
    width: '100%',
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    marginTop: 10,
    margin: 10,
    height: 55,
  },

  challengeModeWordPrompt:
  {
    fontSize: 30,
    fontWeight: 'bold',
    backgroundColor: '#8c1f08',
    width: 300,
    textAlign: 'center',
    padding: 15,
    color: 'white',
    marginBottom: 10,
  },

  challengeModeWordLengthPrompt:
  {
    marginTop: 5,
    padding: 3,
    fontWeight: 'bold',
    textAlign: 'center',
  },


  errorText:
  {
    fontSize: 18,
    fontWeight: 'bold',
  },

  gameplayContainer:
  {
    margin: 25,
  },


  modeTitleContainer:
  {
    backgroundColor: 'red',
    width: '100%',
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
  },

  modeTitleText:
  {

    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,

  },

  modeInputText:
  {
    height: 60,
    width: 300,
    margin: 20,
    borderWidth: 2,
    padding: 10,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#5b5d52'
  },

  modeTitleScore:
  {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
  },



});
