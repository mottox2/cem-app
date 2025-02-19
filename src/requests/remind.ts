import { app } from '../initializers/bolt'
import { Message } from '../types/slack'
const config = require(`config`)

export default function() {
  app.receiver.app.get(`/slack/remind`, (req, res) => {
    res.sendStatus(200)
    const fromCron = req.header(`X-Appengine-Cron`) === `true`
    const channels = config.get(`Slack.Channels`)
    const now = new Date()
    const today = now.getDate()
    const tommorrow = new Date(now.setDate(today + 1)).getDate()

    let text = ``
    let channel = ``
    let postingMsg = true
    if (today === 1) {
      text = `新しい月の始まりです！今月も目標を立てて一歩一歩行きましょう！Let's Challenge！`
      channel = channels.publish
    } else if (today === 15) {
      text = `月の真ん中、折り返し地点ですね。軽く振り返ってみましょうか。進捗どうですか？`
      channel = channels.progress
    } else if (tommorrow === 1) {
      text = `今月もお疲れさまでした。振り返りをしましょう！`
      channel = channels.review
    } else {
      postingMsg = false
    }
    const msg: Message = {
      token: process.env.SLACK_BOT_TOKEN,
      text: `<!channel>\n${text}`,
      channel: channel,
    }
    if (fromCron && postingMsg) {
      return app.client.chat.postMessage(msg).catch(err => {
        throw new Error(err)
      })
    } else {
      let msg = ``
      if (!fromCron) {
        msg += `the request does not come from cron\n`
      }
      if (!postingMsg) {
        msg += `it is not time to remind\n`
      }
      console.log(msg)
    }
  })
}
