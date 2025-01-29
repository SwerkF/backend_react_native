import { wsManager } from '../app';

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user.id;

    // Sauvegarder le message dans la base de données
    const savedMessage = await saveMessageToDb(senderId, recipientId, message);

    // Envoyer le message via WebSocket
    wsManager.sendToUser(recipientId, {
      type: 'NEW_MESSAGE',
      payload: {
        messageId: savedMessage.id,
        senderId,
        message
      }
    });

    res.status(200).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
}; 