const config = require("../../config")
const { log } = require("../../functions")
const envs = require("../../envs.js")
const { updateUserRank } = require("../../../handlers/donate.js")
const {
  getFormattedWallet,
} = require("../../../utils/helperFunctions.js")

module.exports = {
  event: "messageReactionAdd",
  /**
   *
   * @param {ExtendedClient} client
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').User} user
   * @returns
   */
  run: async (client, interaction, user) => {
    if (user.bot) {
      return
    }

    await interaction.deferReply({ ephemeral: true })

    const reactionEmoji = interaction._emoji.name
    for (const emojiConfig of envs.EMOJIS_CONFIG) {
      if (emojiConfig.emoji === reactionEmoji) {
        const sats = emojiConfig.sats
        const receiver = user

        try {
          if (sats <= 0)
            return FollowUpEphemeralResponse(
              interaction,
              "No se permiten saldos negativos"
            )

          const receiverData = await interaction.guild.members.fetch(
            receiver.user.id
          )

          const senderWallet = await getFormattedWallet(
            interaction.user.username,
            interaction.user.id
          )

          const receiverWallet = await getFormattedWallet(
            receiverData.user.username,
            receiverData.user.id
          )

          if (!senderWallet.id || !receiverWallet.id)
            return FollowUpEphemeralResponse(
              interaction,
              "Ocurrió un error al obtener la información del usuario"
            )

          if (senderWallet.id === receiverWallet.id)
            return FollowUpEphemeralResponse(
              interaction,
              "No puedes enviarte sats a vos mismo."
            )

          const isValidAmount = validateAmountAndBalance(
            sats,
            senderWallet.balance
          )

          if (!isValidAmount.status)
            return FollowUpEphemeralResponse(interaction, isValidAmount.content)

          const message = interaction.options.get("message")
            ? interaction.options.get("message")
            : {
              value: `${senderWallet.user.username} te envío ${sats} sats a través de discord`,
            }

          const invoiceDetails = await receiverWallet.sdk.createInvote(
            sats,
            message.value
          )

          const invoicePaymentDetails = await senderWallet.sdk.payInvoice(
            invoiceDetails.payment_request
          )

          if (invoicePaymentDetails) {
            await updateUserRank(interaction.user.id, "comunidad", sats)

            await interaction.deleteReply()
            await interaction.followUp({
              content: `${interaction.user.toString()} envió ${sats} satoshis a ${receiverData.toString()}`,
            })
          }
        } catch (err) {
          console.log(err)
          return FollowUpEphemeralResponse(interaction, "Ocurrió un error")
        }

        await user.send(`Sent ${emojiConfig.sats} to ${receiver.user.name}`, { ephemeral: true })
        return
      }
    }
  },
}
