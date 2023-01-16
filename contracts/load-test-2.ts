import { Router } from '../utils/router'
import {
  Envelope,
  envelope,
  successfulResponse,
  timetokenData,
} from '../utils/subscribe'
import {
  rand,
  randHexaDecimal,
  randPhrase,
  randRecentDate,
  randSkill,
  randUuid,
} from '@ngneat/falso'

let timePassed = 0
let createdUsers = new Map<String, number>()
let occupancy = 0

function addToCache(userID: String) {
  if (userID == undefined) {
    return
  }

  if (createdUsers.has(userID)) {
    createdUsers.set(userID, createdUsers.get(userID) + 1)
  } else {
    console.log(userID)

    createdUsers.set(userID, 1)
    occupancy++

    console.log(occupancy)
  }
}

function generateUsers(amount: number, avatarType: number) {
  const result = []
  for (let i = 1; i < amount; i++) {
    result.push({
      name: 'user_' + i,
      custom: {
        title: randSkill(),
      },
      email: null,
      eTag: randHexaDecimal({ length: 10 }).join(''),
      externalId: null,
      id: 'user_' + i,
      profileUrl:
        avatarType === 1 ? `https://i.pravatar.cc/36?u=user_${i}` : null,
      updated: randRecentDate(),
    })
  }

  return result
}

function generateOccupancyPayload() {
  return {
    occupancy: occupancy,
    timestamp: +new Date(),
    state: null,
    uuid: 'user_0',
    action: 'interval', //join, leave, timeout, stateChange, interval
    refreshHereNow: false,
  }
}

function generatePayload(user) {
  const rand = randUuid()
  return {
    id: rand,
    type: 'default',
    text: randPhrase() + ' ' + user.id,
    sender: user,
    createdAt: new Date().toISOString(),
  }
}

function generateEnvelopes({ startTimetoken, amount, channel, subKey, users }) {
  const result: Envelope[] = []
  let start = BigInt(startTimetoken)
  let messageTimetoken = (start++).toString()

  if (timePassed >= 10000) {
    timePassed = 0
    result.push(
      envelope({
        messageType: 999,
        channel: 'demo-pnpres',
        sender: 'user_0',
        subKey: subKey,
        publishingTimetoken: {
          t: messageTimetoken,
          r: 0,
        },
        payload: generateOccupancyPayload(),
      })
    )
  }

  for (let i = 0; i < amount; i++) {
    let user: any = rand(users)
    messageTimetoken = (start++).toString()
    addToCache(user.id)

    result.push(
      envelope({
        messageType: 0,
        channel: channel,
        sender: user.id,
        subKey: subKey,
        publishingTimetoken: {
          t: messageTimetoken,
          r: 0,
        },
        payload: generatePayload(user),
      })
    )
  }

  return result
}

export const name = 'loadTest'

const router = new Router(expect)

type Options = {
  delayBeforeStart: string
  users: string
  avatarType: string
  channel: string
  subscribeKey: string

  chunksPerSecond: string
  messagesPerChunk: string
}

export default async function (options: Options) {
  const users = generateUsers(Number(options.users), Number(options.avatarType))

  router.get('/v2/subscribe/:subkey/:channel/0', async (req, params) => {
    if (req.url.query?.tt === '0') {
      return {
        status: 200,
        body: successfulResponse(timetokenData(timetoken.now())),
      }
    }

    await sleep(1000 / Number(options.chunksPerSecond))

    const envelopes = generateEnvelopes({
      startTimetoken: timetoken.now(),
      amount: Number(options.messagesPerChunk),
      channel: options.channel,
      subKey: options.subscribeKey,
      users,
    })

    return {
      status: 200,
      body: successfulResponse(timetokenData(timetoken.now()), envelopes),
    }
  })

  router.get('/v2/herenowendpoint', async (req, params) => {
    // do whatever you want

    return { status: 200, body: {} }
  })

  await router.run()
}
