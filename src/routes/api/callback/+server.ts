import { users, repo } from '#/settings.json'
import { EventMethods, workflowEmoji } from '$lib'

import { json } from '@sveltejs/kit'

export async function POST(event) {
  const methods = new EventMethods(event)
  await methods.setup()
  console.log(methods.data)
  return await json({ok: true})

  const workflows = await methods.listWorkflowRuns()
  const selectedWorkflow = workflows.find(w => String(w.id) === event.params.workflow)
  if (!selectedWorkflow) {
    return await json({error: "Workflow not found"}, {status: 400})
  }
  const { id, name, status, conclusion, html_url } = selectedWorkflow
  const prData = name.match('#([0-9]*)')
  if (!prData) {
    return await json({error: "Can't detect PR number"}, {status: 400})
  }
  const pr = prData[1]
  const triggerData = name.match('for (.*)')
  if (!triggerData) {
    return await json({error: "Can't detect trigger owner"}, {status: 400})
  }
  const triggerUser = triggerData[1]
  const triggerChatID = Object.keys(users).find(k => users[k] === String(triggerUser))
  console.log({triggerChatID, selectedWorkflow, triggerData})
  if (!triggerChatID) {
    return await json({error: "Can't detect trigger owner"}, {status: 400})
  }
  const emoji = workflowEmoji(selectedWorkflow)

  return await json(await methods.telegramReply(`${emoji} **${name}**\n\n• [Result](${html_url})\n• [PR](https://github.com/NixOS/nixpkgs/pull/${pr})`, triggerChatID), {status: 200})
}