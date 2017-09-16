import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  TextInput,
  TouchableHighlight,
  FlatList
} from 'react-native'
import moment from 'moment'
import SendBird from 'sendbird'

console.disableYellowBox = true

const sb = new SendBird({ 'appId': 'YOUR_APP_ID' })
const myUserId = 'hoge'
const friendUserId = 'fuga'

const themeColor = '#44bec7'
const themeDarkColor = '#287277'

let channel
let messageQuery

export default class SendBirdSample extends Component {
  constructor(props) {
    super(props)
    this.createGroupChannel = this.createGroupChannel.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.state = { text: '', messages: [] }
  }

  componentDidMount() {
    sb.connect(myUserId, (user, error) => {
      this.createGroupChannel()
      const ChannelHandler = new sb.ChannelHandler()
      ChannelHandler.onMessageReceived = (receivedChannel, message) => {
        if (receivedChannel.url === channel.url) {
          const messages = []
          messages.push(message)
          const newMessages = messages.concat(this.state.messages)
          this.setState({ messages: newMessages })
          if (channel.channelType == 'group') {
            channel.markAsRead()
          }
        }
      }
      sb.addChannelHandler('ChatView', ChannelHandler)

      const ConnectionHandler = new sb.ConnectionHandler()
      ConnectionHandler.onReconnectSucceeded = () => {
        this.getChannelMessage(true)
        channel.refresh()
      }
      sb.addConnectionHandler('ChatView', ConnectionHandler)
    })
  }

  createGroupChannel() {
    const userIds = [friendUserId];
    const name = 'sample group channel'
    sb.GroupChannel.createChannelWithUserIds(userIds, true, name, null, '', (createdChannel, error) => {
      if (error) {
        console.error(error)
        return
      }
      channel = createdChannel
      messageQuery = channel.createPreviousMessageListQuery()
      this.getChannelMessage(false)
    });
  }

  sendMessage() {
    channel.sendUserMessage(this.state.text, '', (message, error) => {
      if (error) {
        console.error(error)
        return
      }
      const messages = [].concat([message]).concat(this.state.messages)
      this.setState({ text: '', messages })
    });
  }

  getChannelMessage(refresh) {
    if (refresh) {
      messageQuery = channel.createPreviousMessageListQuery()
      this.state.messages = []
    }

    if (messageQuery) {
      if (!messageQuery.hasMore) {
        return
      }
      messageQuery.load(20, false, (response, error) => {
        if (error) {
          console.log('Get Message List Fail.', error)
          return
        }

        const messages = []
        for (let i = 0 ; i < response.length; i++) {
          messages.push(response[i])
        }

        const newMessageList = this.state.messages.concat(messages.reverse())
        this.setState({ messages: newMessageList })
      })
    }
  }

  renderMessage(msg) {
    const createdAt = moment(msg.createdAt).format('H:mm')
    if (msg._sender.userId === myUserId) {
      return (
        <View style={[styles.messageContainer, { paddingLeft: 50 }]}>
          <View style={{ justifyContent: 'flex-end' }}>
            <Text style={styles.createdAt}>{createdAt}</Text>
          </View>
          <View style={[styles.messageBody, { backgroundColor: themeColor }]}>
            <Text style={{ color: 'white' }}>{msg.message}</Text>
          </View>
          <Image source={{ uri: msg._sender.profileUrl }} style={[styles.profile, { marginLeft: 10 }]} />
        </View>
      )
    }
    return (
      <View style={[styles.messageContainer, { paddingRight: 50 }]}>
        <Image source={{ uri: msg._sender.profileUrl }} style={[styles.profile, { marginRight: 10 }]} />
        <View style={[styles.messageBody, { backgroundColor: '#efefef' }]}>
          <Text style={{ color: 'black' }}>{msg.message}</Text>
        </View>
        <View style={{ justifyContent: 'flex-end' }}>
          <Text style={styles.createdAt}>{createdAt}</Text>
        </View>
      </View>
    )
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{friendUserId}</Text>
        </View>
        <FlatList
          inverted
          onEndReached={() => this.getChannelMessage(false)}
          data={this.state.messages}
          renderItem={({ item }) => this.renderMessage(item)}
          style={{ flex: 1 }}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={styles.textInput}
            placeholder="Write a chat"
            onChangeText={(text) => this.setState({ text })}
            value={this.state.text}
          />
          <TouchableHighlight onPress={this.sendMessage} style={styles.sendButton} underlayColor={themeDarkColor}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableHighlight>
        </View>
      </View>
    )
  }
}

const styles = {
  header: {
    height: 64,
    backgroundColor: themeColor,
    borderColor: 'lightgray',
    borderTopWidth: StyleSheet.hairlineWidth
  },
  headerText: {
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 44,
    fontSize: 18
  },
  textInput: {
    height: 40,
    borderColor: 'lightgray',
    borderTopWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingHorizontal: 8,
    marginTop: 10
  },
  sendButton: {
    width: 80,
    backgroundColor: themeColor,
    height: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgray',
    marginTop: 10
  },
  sendButtonText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 40,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  messageContainer: {
    flexDirection: 'row',
    padding: 10
  },
  messageBody: {
    flex: 1,
    padding: 8,
    borderRadius: 5
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  createdAt: {
    color: 'gray',
    fontSize: 12,
    marginHorizontal: 5
  }
}
