import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http'
import {Observable, throwError} from 'rxjs'
import {catchError, retry} from 'rxjs/operators'

let cls: HomeComponent | undefined

// Taken from https://stackoverflow.com/a/40031979 -- thank you!
function arrayBufferToHex(buffer: ArrayBuffer) 
{
  const byteArray = new Uint8Array(buffer)
  let hexParts: string[] = []
  byteArray.forEach(function (value) {
    const hex = value.toString(16)
    const padded = ('00' + hex).slice(-2)
    hexParts.push(padded)
  })
  
  return '0x' + hexParts.join('')
}

//number must be in format 0xAABBCCDD
function swapEndian(data: number)
{
  let leftmostByte = (data & 0x000000FF) >> 0
  let leftMiddleByte = (data & 0x0000FF00) >> 8
  let rightMiddleByte = (data & 0x00FF0000) >> 16
  let rightmostByte = (data & 0xFF000000) >> 24

  leftmostByte <<= 24
  leftMiddleByte <<= 16
  rightMiddleByte <<= 8
  rightmostByte <<= 0
  return leftmostByte | leftMiddleByte | rightMiddleByte | rightmostByte
}

//number formatted as 0xAABB
function swap2Byte(data: number)
{
  let leftByte = (data & 0xFF00) >> 8
  let rightByte = (data & 0xFF) << 8
  return leftByte | rightByte
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private http: HttpClient) {}

  serverAddress = 'http://localhost:5000';
  qusbAddress = 'ws://localhost:8080';

  connected = false
  deviceList: any[] = []
  device = ""
  deviceSelected = false
  info = ""
  confirmed = false

  socket: WebSocket | undefined

  ngOnInit(): void {}

  connect() {
    cls = this
    this.connected = true;
    this.socket = new WebSocket(this.qusbAddress);
    this.socket.binaryType = 'arraybuffer'
    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
  }

  onOpen() {
    console.log('Successfully connected to QUsb2Snes.');
  }

  onClose() {
    // this.connected = false;
    window.location.reload()
    console.log('Lost connection to QUsb2Snes; reloaded page');
  }

  // Sends QUsb2Snes a request for the device list and populates the
  // selector on the page.
  getDeviceList()
  { 
    if (this.socket) {
        this.socket.onmessage = function (msg) {
            console.log("Received data: " + msg.data)
            setDevices(JSON.parse(msg.data)["Results"])
        }
        
        this.socket.send(JSON.stringify({
            "Opcode": "DeviceList",
            "Space": "SNES"
        }));
        
        // this.deviceList = devices this runs too fast
    }
  }
  
  // Attaches to the selected device and asks QUsb2Snes for information,
  // and subsequently displays it for confirmation
  selectDevice() 
  {
      if (!this.socket) return
      this.deviceSelected = true
      this.socket?.send(JSON.stringify({
          "Opcode": "Attach",
          "Space": "SNES",
          "Operands": [this.device]
      }))
      
      this.socket.onmessage = function (msg) {
          console.log("Returned info is " + msg.data)
          let info = JSON.parse(msg.data)["Results"]
          cls!.info = info[1] + " - " + info[2]
      }
      this.socket?.send(JSON.stringify({
          "Opcode": "Info",
          "Space": "SNES"
      }))
  }
  
  incorrectDevice()
  {
      this.deviceSelected = false
  }
  
  // Confirms the user's desired QUsb2Snes device, and begins the 
  // commuinication with the python server. 
  confirmDevice()
  {
    this.confirmed = true
    // Gets the settings from the server, partially to make sure the connection works, and partially
    // to inform the decisions of some of the methods later on. Mostly it cuts out the need for
    // running methods that aren't going to do anything based on disabled settings.
    this.http.get(this.serverAddress + "/settings").subscribe((res: any) => {
      settings = res
    })

    // The core http loop; runs every second
    setInterval(checkQUsb2Snes, 1000)
  }
  
  // wrapper for the http get function; allows it to be used outside of this class
  get(path: string)
  {
    return this.http.get(this.serverAddress + path)
  }
  
  // wrapper for the http post function; as above
  post(path: string, body: any)
  {
    return this.http.post(this.serverAddress + path, body)
  }
  
}

function setDevices(newDevices: any[]) {
    cls!.deviceList = newDevices
}

let settings = {
  "share_health": true,
  "share_ammo": true,
  "share_items": true,
  "trade_items": false
}

let running = false

let abilities = 0
let beams = 0
let energyCapacity = 99
let missilesCapacity = 0
let supersCapacity = 0
let powerBombsCapacity = 0

let health = 99
let missiles = 0
let supers = 0
let powerBombs = 0

function readAddressCommand(address: string, size: number)
{
  return JSON.stringify({
    "Opcode": "GetAddress",
    "Space": "SNES",
    "Operands": [address, size]
  })
}

async function write(address: string, size: number, data: number, swap = false)
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.send(JSON.stringify({
      "Opcode": "PutAddress",
      "Space": "SNES",
      "Operands": [address, size]
    }))
    
    if (swap) data = swapEndian(data)
    
    console.log("[debug] writing to RAM addr " + address + " with value 0x" + data.toString(16))
    
    // Writing one byte with an Int32Array buffer was causing an error
    // for QUsb2Snes. The solution was to use an Int8Array buffer when sending one
    // byte and larger arrays for their corresponding sizes.
    let ab
    if (size == 4) ab = new Int32Array([data]).buffer
    else if (size == 2) ab = new Int16Array([data]).buffer
    else ab = new Int8Array([data]).buffer
    
    cls!.socket!.send(ab)
    
    resolve(data)
  })
}

async function checkQUsb2Snes()
{
  if (running) return
  running = true
  
  if (settings['share_items'])
  {
    // console.log("Checking missile capacity...")
    await checkMissileCapacity()
    // console.log("Checking super missile capacity...")
    await checkSupersCapacity()
    // console.log("Checking power bomb capacity...")
    await checkPowerBombsCapacity()
    // console.log("Checking energy capacity...")
    await checkEnergyCapacity()
    // console.log("Checking abilties...")
    await checkAbilities()
    // console.log("Checking beams...")
    await checkBeams()
  }
  
  if (settings['share_health'])
  {
    await checkHealth()
  }

  if (settings['share_ammo'])
  {
    await checkMissiles()
    await checkSupers()
    await checkPowerBombs()
  }

  // Ensure status is applied
  // console.log("Updating status from server...")
  await ensureStatus()
  
  running = false
}

async function ensureStatus()
{
  cls!.get('/sm/status').subscribe(async (res: any) => {

    if (settings['share_items'])
    {
      let energy = res['energy capacity']
      if (energy != energyCapacity) 
      {
        console.log("Updating energy from " + energyCapacity + " to " + energy)
        await write("0xF509C4", 2, energy)
        energyCapacity = energy
      }
      let missiles = res['missile capacity']
      if (missiles != missilesCapacity) 
      {
        console.log("Updating missiles from " + missilesCapacity + " to " + missiles)
        await write("0xF509C8", 2, missiles)
        missilesCapacity = missiles
      }
      
      let supers = res['supers capacity']
      if (supers != supersCapacity) 
      {
        console.log("Updating supers from " + supersCapacity + " to " + supers)
        await write("0xF509CC", 2, supers)
        supersCapacity = supers
      }
      
      let powerBombs = res['power bomb capacity']
      if (powerBombs != powerBombsCapacity) 
      {
        console.log("Updating power bombs from " + powerBombsCapacity + " to " + powerBombs)
        await write("0xF509D0", 2, powerBombs)
        powerBombsCapacity = powerBombs
      }
      
      let newAbilities = res['ability value']
      // console.log("[DEBUG] ability value is 0x" + abilities.toString(16) + ". Server gave 0x" + newAbilities.toString(16) + ".")
      if (abilityValueChanged(newAbilities)) 
      {
        newAbilities = checkAutoEquipAbilities(newAbilities)
        console.log("Updating ability value from " + abilities + " to " + newAbilities)
        await write("0xF509A2", 4, newAbilities, true)
        abilities = newAbilities
      }
      
      let newBeams = res['beam value']
      if (beamValueChanged(newBeams)) 
      {
        newBeams = checkAutoEquipBeams(newBeams)
        console.log("Updating beams value from " + beams.toString(16) + " to " + newBeams)
        await write("0xF509A6", 4, newBeams, true)
        beams = newBeams
      }
    }

    if (settings['share_health'])
    {
      let newHealth = res['health']
      if (health != newHealth)
      {
        console.log("Updating health from " + health + " to " + newHealth)
        await write("0xF509C2", 2, newHealth)
        health = newHealth
      }
    }

    if (settings['share_ammo'])
    {
      let newMissiles = res['missiles']
      if (newMissiles != missiles)
      {
        console.log("Updating missile ammo from " + missiles + " to " + newMissiles)
        await write("0xF509C6", 2, newMissiles)
        missiles = newMissiles
      }

      let newSupers = res['supers']
      if (newSupers != supers)
      {
        console.log("Updating supers ammo from " + supers + " to " + newSupers)
        await write("0xF509CA", 2, newSupers)
        supers = newSupers
      }

      let newPowerBombs = res['power bombs']
      if (newPowerBombs != powerBombs)
      {
        console.log("Updating power bomb ammo from " + powerBombs + " to " + newPowerBombs)
        await write("0xF509CE", 2, newPowerBombs)
        powerBombs = newPowerBombs
      }
    }
    
  })
}

function checkAutoEquipAbilities(newAbilities: number)
{
  // if the player has unequipped an ability, their equipped and collected values won't match.
  // If this is the case, we may not want to automatically change what they have equipped.
  let equipped = (abilities >> 16)
  let collected = abilities & 0x0000ffff
  // If the player has changed their equipped abilities
  if (equipped != collected)
  {
    // Get the equipped abilities from the old value
    equipped = abilities & 0xffff0000
    // Get the collected abilities from the new value/dump the equipped value
    newAbilities &= 0x0000ffff 
    // Combine the two for new collected, old equipped
    newAbilities |= equipped

    //Theoretically we don't need to do any kind of checks here;
    // you don't lose abilities in super metroid so you won't need to have something
    // forced unequipped (like with the beams and spazer)
  }
  return newAbilities
}

//TODO: Make the following function not care about spazer

function checkAutoEquipBeams(newBeams: number)
{
  // In addition to what the equivalent ability function does, this will also turn off
  // spazer if plasma is equipped
  let equipped = (beams >> 16)
  let collected = beams & 0x0000ffff

  if (equipped != collected)
  {
    // If auto equip is off, plasma won't auto equip and spazer won't cause any issues
    equipped = beams & 0xffff0000
    newBeams &= 0x0000ffff
    newBeams |= equipped
  }
  // 0x08000000 is the bit that will be on when plasma is equipped.
  else if (newBeams & 0x08000000)
  {
    // if auto equip is on, we need to disable spazer if we have plasma equipped
    // anding this will flip off 0x04000000, the bit that's on when spazer is equipped
    newBeams &= (~0x04000000)
  }
  return newBeams
}

// TODO consolidate the following functions that are exactly the same save for one changing word and address

async function checkMissileCapacity() 
{
  // Promise wrapper to allow awaiting function
  return new Promise(function(resolve, reject) {
    // Sets the socket on message to handle result of reading missile memory
    cls!.socket!.onmessage = function (msg) {
      // Checks to make sure what was returned was memory values
      if (msg.data instanceof ArrayBuffer) {
        // Converts the resulting data to hex, which is converted 
        //  from a string to a number, which is then endian swapped
        let newCap = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newCap != missilesCapacity) {
          console.log("Missile capacity changed. New capacity is " + newCap);
          // Tell the server that our missile cap changed
          cls!.post('/sm/acquired/missiles', {
            "capacity": newCap
          }).subscribe((res: any) => {
            console.log("Successfully posted missiles to server. Response was " + JSON.stringify(res))
          })
          // Update the missile cap
          missilesCapacity = newCap;
        }
        resolve(newCap)
      }
      reject("msg.data was not of type ArrayBuffer")
    }
  
    // Send the read command to QUsb2Snes
    // This triggers the response that's handled above
    cls!.socket!.send(readAddressCommand("0xF509C8", 2))
  })
}

async function checkSupersCapacity()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newCap = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newCap != supersCapacity)
        {
          console.log("Super Missile capacity changed. New capacity is " + newCap)
          cls!.post('/sm/acquired/supers', {
            "capacity": newCap
          }).subscribe((res: any) => {
            console.log("Successfully posted supers to server. Response was " + JSON.stringify(res))
          })
          supersCapacity = newCap
        }
        resolve(newCap)
      }
      reject("msg.data was not of type ArrayBuffer")
    }
    
    cls!.socket!.send(readAddressCommand("0xF509CC", 2))
  })
}

async function checkPowerBombsCapacity()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newCap = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newCap != powerBombsCapacity)
        {
          console.log("Power Bomb capacity changed. New capacity is " + newCap)
          cls!.post('/sm/acquired/powerbombs', {
            "capacity": newCap
          }).subscribe((res: any) => {
            console.log("Successfully posted power bombs to server. Response was " + JSON.stringify(res))
          })
          powerBombsCapacity = newCap
        }
        resolve(newCap)
      }
      reject("msg.data was not of type ArrayBuffer")
    }
    
    cls!.socket!.send(readAddressCommand("0xF509D0", 2))
  })
}

async function checkEnergyCapacity()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newCap = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newCap != energyCapacity)
        {
          console.log("Energy capacity changed. New capacity is " + newCap)
          cls!.post('/sm/acquired/energy', {
            "capacity": newCap
          }).subscribe((res: any) => {
            console.log("Successfully posted energy to server. Response was " + JSON.stringify(res))
          })
          energyCapacity = newCap
        }
        resolve(newCap)
      }
      reject("msg.data was not of type ArrayBuffer")
    }
    
    cls!.socket!.send(readAddressCommand("0xF509C4", 2))
  })
}

async function checkHealth()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newHealth = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newHealth != health)
        {
          console.log("Health changed. New health is " + newHealth)
          cls!.post('/sm/health', {
            "health": newHealth
          }).subscribe((res: any) => {
            console.log("Successfully posted new health to server. Response was " + JSON.stringify(res))
          })
          health = newHealth
        }
        resolve(newHealth)
      }
      reject("msg.data was not of type ArrayBuffer")
    }

    cls!.socket!.send(readAddressCommand("0xF509C2", 2))
  })
}

async function checkMissiles()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newMissiles = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newMissiles != missiles)
        {
          console.log("Missile ammo changed. New amount is " + newMissiles)
          cls!.post('/sm/ammo/missiles', {
            "missiles": newMissiles
          }).subscribe((res: any) => {
            console.log("Successfully posted new missile ammo. Response was " + JSON.stringify(res))
          })
          missiles = newMissiles
        }
        resolve(newMissiles)
      }
      reject("msg.data was not of type ArrayBuffer")
    }

    cls!.socket!.send(readAddressCommand("0xF509C6", 2))
  })
}

async function checkSupers()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newSupers = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newSupers != supers)
        {
          console.log("Supers ammo changed. New amount is " + newSupers)
          cls!.post('/sm/ammo/supers', {
            'supers': newSupers
          }).subscribe((res: any) => {
            console.log("Successfully posted new supers ammo. Res was " + JSON.stringify(res))
          })
          supers = newSupers
        }
        resolve(newSupers)
      }
      reject("msg.data was not of type ArrayBuffer")
    }

    cls!.socket!.send(readAddressCommand("0xF509CA", 2))
  })
}

async function checkPowerBombs()
{
  return new Promise(function (resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer) 
      {
        let newPowerBombs = swap2Byte(Number(arrayBufferToHex(msg.data)))
        if (newPowerBombs != powerBombs)
        {
          console.log("Power Bombs ammo changed. New amount is " + newPowerBombs)
          cls!.post('/sm/ammo/powerbombs', {
            "power bombs": newPowerBombs
          }).subscribe((res: any) => {
            console.log("Successfully posted new pbombs ammo. Res was " + JSON.stringify(res))
          })
          powerBombs = newPowerBombs
        }
        resolve(newPowerBombs)
      }
      reject("msg.data was not of type ArrayBuffer")
    }

    cls!.socket!.send(readAddressCommand("0xF509CE", 2))
  })
}

async function checkAbilities()
{
  return new Promise(function(resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newValue = Number(arrayBufferToHex(msg.data))
        if (abilityValueChanged(newValue))
        {
          console.log("Ability value changed. New ability value is 0x" + newValue.toString(16) + ", old value is 0x" + abilities.toString(16))
          cls!.post('/sm/abilities', {
            "ability value": newValue
          }).subscribe((res: any) => {
            console.log("Successfully posted ability to server. Response was " + JSON.stringify(res))
          })
          abilities = newValue
        }
        resolve(newValue)
      }
      reject("msg.data was not of type ArrayBuffer")
    }
    
    cls!.socket!.send(readAddressCommand("0xF509A2", 4))
  })
}

async function checkBeams()
{
  return new Promise(function(resolve, reject) {
    cls!.socket!.onmessage = function (msg) {
      if (msg.data instanceof ArrayBuffer)
      {
        let newBeams = Number(arrayBufferToHex(msg.data))
        if (beamValueChanged(newBeams))
        {
          console.log("New beam acquired. New beam values is " + newBeams.toString(16))
          cls!.post('/sm/beams', {
            "beam value": newBeams
          }).subscribe((res: any) => {
            console.log("Successfully posted beams to server. Response was " + JSON.stringify(res))
          })
          beams = newBeams
        }
        resolve(newBeams)
      }
      reject("msg.data was not of type ArrayBuffer")
    }
    
    cls!.socket!.send(readAddressCommand("0xF509A6", 4))
  })
}

function abilityValueChanged(newValue: number): boolean
{
  // Ability value is formatted with the first two bytes being equipped
  // and the second two bytes being collected.
  // We don't care if the equipped changes.

  let collected = abilities & 0x0000ffff
  newValue &= 0x0000ffff

  return newValue != collected

}

function beamValueChanged(newValue: number): boolean
{
  let collected = beams & 0x0000ffff
  newValue &= 0x0000ffff
  return newValue != collected
}