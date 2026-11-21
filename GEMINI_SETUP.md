# Atelier Ourlet — activer le vrai chatbot Gemini

Le site GitHub Pages contient un chatbot de démonstration. Une vraie IA nécessite une API sécurisée : ne placez **jamais** la clé Google Gemini dans `chat-widget.js`, dans un fichier HTML ou dans une variable JavaScript publique.

## Configuration sans terminal

1. Ouvrez [Google AI Studio](https://aistudio.google.com/apikey) et créez une clé Gemini API pour le projet. Les quotas gratuits dépendent du compte et du modèle.
2. Créez un compte Cloudflare puis allez dans **Workers & Pages → Create → Worker**.
3. Dans l'éditeur Cloudflare, remplacez le code par celui de `cloudflare-worker.js`, puis déployez.
4. Dans les paramètres de votre Worker → **Variables and Secrets**, ajoutez une variable de type **Secret** nommée exactement `GEMINI_API_KEY` et collez sa valeur. Déployez de nouveau si nécessaire.
5. Copiez l'adresse de votre Worker, par exemple `https://atelier-ourlet-chat.votre-compte.workers.dev`.
6. Dans `chat-widget.js`, définissez `apiEndpoint` sur cette URL **avec `/chat`** : `https://atelier-ourlet-chat.votre-compte.workers.dev/chat`. Publiez le fichier.
7. Testez plusieurs messages sur le site réel. Si l'API n'est pas configurée, le mode de démonstration scripté reste actif.

## Important

- Le modèle configuré est `gemini-2.5-flash-lite`; le niveau gratuit est soumis à des limites qui peuvent évoluer.
- Le Worker autorise uniquement l'origine de ce site GitHub Pages (filtre navigateur CORS) ; **ceci n'est pas une authentification** et un appel direct peut contourner l'en-tête Origin. Avant d'ouvrir le site à un trafic important, ajoutez une protection anti-abus (Cloudflare Turnstile et limitations de débit au niveau Cloudflare).
- Les questions envoyées au vrai chatbot sont transmises à Google pour traitement. Ne collectez pas de données personnelles sensibles dans cette démo et adaptez le message de confidentialité.
- Le formulaire de contact et les commandes demeurent fictifs. Ce prototype n'enregistre pas les demandes.
