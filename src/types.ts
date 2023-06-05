export type UserRecord = {
    twitter: string
    balance: string
    inventory?: any[]
  }
  
export type RaidRecord = {
  reward: string
  handles: string[] // Twitter handles of users who have raided tweet
}

export type TwitterRegistrationRecord = {
  username: string
  twitter: string
  code: string
}