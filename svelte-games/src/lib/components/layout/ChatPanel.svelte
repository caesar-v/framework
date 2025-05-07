<script lang="ts">
  // Sample chat messages for demo
  const chatMessages = [
    { id: 1, sender: 'System', message: 'Welcome to Playtagon Live Chat!', time: '12:30', isSystem: true },
    { id: 2, sender: 'Alex', message: 'Hey everyone! Just won 500 on dice game!', time: '12:32', isSystem: false },
    { id: 3, sender: 'Maria', message: 'Congrats Alex! 🎉', time: '12:33', isSystem: false },
    { id: 4, sender: 'Support', message: 'If anyone needs help, just tag @support', time: '12:35', isSystem: true },
    { id: 5, sender: 'John', message: 'Which game has the best odds?', time: '12:37', isSystem: false },
    { id: 6, sender: 'Support', message: '@John Check out our card games section!', time: '12:38', isSystem: true },
    { id: 7, sender: 'Sophia', message: 'Anyone else having fun with the new arcade games?', time: '12:42', isSystem: false },
    { id: 8, sender: 'Alex', message: 'Yep, the puzzle games are addictive', time: '12:45', isSystem: false }
  ];
  
  // New message handling
  let newMessage = '';
  
  function sendMessage() {
    if (newMessage.trim() === '') return;
    
    // In a real app, would send message to a service
    console.log('Sending message:', newMessage);
    
    // Clear the input
    newMessage = '';
  }
  
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="chat-panel flex flex-col h-full">
  <!-- Chat Messages -->
  <div class="chat-messages flex-1 overflow-y-auto p-3 space-y-3">
    {#each chatMessages as message}
      <div class="chat-message" class:system-message={message.isSystem}>
        <div class="message-header flex items-center gap-1 mb-1">
          <span class="sender-name text-xs font-semibold" class:text-accent={message.isSystem}>
            {message.sender}
          </span>
          <span class="message-time text-xs text-text-secondary">
            {message.time}
          </span>
        </div>
        <div class="message-content bg-primary rounded-md p-2 text-sm">
          {message.message}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Chat Input -->
  <div class="chat-input p-3 border-t border-border">
    <div class="relative">
      <textarea 
        bind:value={newMessage}
        on:keydown={handleKeyDown}
        class="w-full bg-primary rounded-md p-2 pr-10 resize-none h-20 text-sm"
        placeholder="Type your message..."></textarea>
      <button 
        class="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center bg-accent text-white rounded-full"
        on:click={sendMessage}
        disabled={newMessage.trim() === ''}>
        ↑
      </button>
    </div>
    <div class="text-xs text-text-secondary mt-1">
      Press Enter to send, Shift+Enter for new line
    </div>
  </div>
</div>

<style>
  .system-message .message-content {
    background-color: rgba(88, 166, 255, 0.1);
    border-left: 2px solid var(--color-accent);
  }
  
  /* Custom scrollbar for chat messages */
  .chat-messages::-webkit-scrollbar {
    width: 4px;
  }
  
  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .chat-messages::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  textarea {
    color: var(--color-text-primary);
    background-color: var(--color-primary);
    border: 1px solid var(--color-border);
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--color-accent);
  }
</style>