import { XMarkIcon } from '@heroicons/react/24/solid';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const KnowledgeBaseModal = ({ isOpen, onClose, title, content }: KnowledgeBaseModalProps) => {
  if (!isOpen) return null;

  // Simple Markdown-to-HTML converter to format the KB content beautifully.
  const createMarkup = (markdown: string) => {
    const html = markdown
      .split('\n')
      .map((line, index, array) => {
        // ### Heading
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-bold text-white mb-3 mt-4">${line.substring(4)}</h3>`;
        }
        // #### Heading
        if (line.startsWith('#### ')) {
          return `<h4 class="text-lg font-semibold text-gray-200 mb-2 mt-3">${line.substring(5)}</h4>`;
        }
        // --- Horizontal Rule
        if (line.trim() === '---') {
          return `<hr class="my-4 border-gray-600" />`;
        }
        
        // Handle list items
        if (line.trim().startsWith('- ')) {
           const isFirstListItem = index === 0 || !array[index - 1].trim().startsWith('- ');
           const isLastListItem = index === array.length - 1 || !array[index + 1].trim().startsWith('- ');
           
           let itemContent = line.trim().substring(2);
           // process inline styles within list item
           itemContent = itemContent
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-900 text-yellow-300 px-1 py-0.5 rounded font-mono text-sm">$1</code>');

           let listHtml = `${isFirstListItem ? '<ul class="space-y-2">' : ''}`;
           listHtml += `<li class="ml-5 list-disc text-gray-300">${itemContent}</li>`;
           listHtml += `${isLastListItem ? '</ul>' : ''}`;
           return listHtml;
        }

        // Handle empty lines as paragraph breaks
        if (line.trim() === '') {
            return '';
        }

        // Handle Paragraphs with inline styles
        let pContent = line
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-900 text-yellow-300 px-1 py-0.5 rounded font-mono text-sm">$1</code>');
        
        return `<p class="mb-2 text-gray-300">${pContent}</p>`;
      })
      .filter(line => line.trim() !== '')
      .join('');

    return { __html: html };
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-xl m-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={createMarkup(content)}>
          {/* Content is now rendered as HTML, replacing the previous plain text <p> tag. */}
        </div>
        <div className="px-6 py-4 bg-gray-900/50 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;