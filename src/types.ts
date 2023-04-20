export type UserRecord = {
    twitter: string
    balance: string
  }
  
export type RaidRecord = {
  type: 'like' | 'retweet'
  reward: string
  handles: string[] // Twitter handles of users who have raided tweet
}