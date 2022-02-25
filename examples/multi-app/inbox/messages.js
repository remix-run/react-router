/**
 * @typedef Message
 * @type {object}
 * @property {string} id
 * @property {string} subject
 * @property {string} body
 * @property {object} from
 * @property {string} from.name
 * @property {string} from.email
 * @property {object} to
 * @property {string} to.name
 * @property {string} to.email
 * @property {string} date
 */

/**
 * @type Message[]
 */
let messages = [
  {
    id: "1",
    from: {
      name: "GitHub",
      email: "noreply@github.com",
    },
    to: {
      name: "Logan McAnsh",
      email: "logan@remix.run",
    },
    subject: "[GitHub] A personal access token has been added to your account",
    body: "Hey mcansh!\n\nA personal access token.....................",
    date: "2021-10-12T15:30:33.566Z",
  },
  {
    id: "2",
    from: {
      name: "Remix",
      email: "news@github.com",
    },
    to: {
      name: "Logan McAnsh",
      email: "logan@remix.run",
    },
    subject: "Remix Goes Open Source, Raises Seed Funding",
    body: "Thanks for following our journey as we built Remix",
    date: "2021-10-11T19:26:00.000Z",
  },
  {
    id: "3",
    from: {
      name: "GitHub",
      email: "noreply@github.com",
    },
    to: {
      name: "Logan McAnsh",
      email: "logan@remix.run",
    },
    subject: "[GitHub] Payment Receipt for mcansh",
    body: "We received payment for your GitHub.com subscription. Thanks for your business!",
    date: "2021-10-05T15:30:33.566Z",
  },
];

/**
 *
 * @param {string} id
 * @returns {Message | undefined}
 */
function getMessageById(id) {
  return messages.find((message) => message.id === id);
}

export { messages, getMessageById };
