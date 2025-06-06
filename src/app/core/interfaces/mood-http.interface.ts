export interface MoodStateRequest {
  name: string,
  description: string,
  image?: string,
  color: string
  materialIcon: string
}

export interface MoodStateResponse {
  id: string,
  name: string,
  description: string,
  image: string,
  color: string,
  isActive: boolean
}
