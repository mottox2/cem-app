import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firebase'
import { Message, Project } from '../types/slack'

const deleteProject = async ({ view, body, context }): Promise<Message> => {
  const payload = view.state.values
  const user = body.user.id
  const metadata = body.view.private_metadata
  const projectId = payload.project.projectId.selected_option.value

  const projectRef = firestore.collection(`projects`).doc(projectId)
  const project = await projectRef.get()
  const { title } = project.data() as Project
  // firestoreからプロジェクトとサブコレクションのチャレンジを削除
  const batch = firestore.batch()
  const challengesRef = await projectRef.collection(`challenges`).get()
  challengesRef.docs.forEach(challenge => {
    batch.delete(challenge.ref)
  })
  batch.delete(projectRef)
  await batch.commit()

  return {
    token: context.botToken,
    text: `新規プロジェクト[${title}]を削除しました`,
    channel: metadata,
    user,
  }
}

export default function() {
  app.view(`cem_delete`, async ({ ack, body, view, context }) => {
    ack()

    const result = await deleteProject({ view, body, context })
    await app.client.chat.postEphemeral(result).catch(err => {
      throw new Error(err)
    })
  })
}
