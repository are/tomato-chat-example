import Pubnub from 'pubnub/dist/web/pubnub'

async function main() {
  await fetch('http://localhost:8090/init?__contract__script__=loadTest')

  const pubnub = new Pubnub({
    origin: 'localhost:8090',
    subscribeKey: 'demo',
    publishKey: 'demo',
    userId: 'test',
    suppressLeaveEvents: true,
  })

  let counter = 0
  let start = performance.now()

  pubnub.addListener({
    message: (msg) => {
      counter++
    },
    status: (status) => {},
  })

  pubnub.subscribe({ channels: ['lmao'] })

  setInterval(() => {
    // const now = performance.now()
    // console.log(counter / ((now - start) / 1000), (now - start) / 1000, counter)

    console.log(counter)
    counter = 0
  }, 1000)
}

const button = document.getElementById('start')

button.addEventListener('click', main)
