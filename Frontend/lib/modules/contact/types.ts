export type ContactMessageDto = {
  name: string
  email: string
  message: string
}

export type ContactApiResponse =
  | { success: true }
  | { success: false; error: string }
