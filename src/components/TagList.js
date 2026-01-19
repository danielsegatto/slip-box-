import React from 'react';

const TagList = ({ tags, onTagClick, variant = 'default' }) => {
  if (!tags || tags.length === 0) return null;

  const baseStyles = "cursor-pointer";
  const styles = {
    default: `${baseStyles} text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full`,
    minimal: `${baseStyles} text-[10px] text-gray-200`
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map(tag => (
        <button 
          key={tag} 
          onClick={(e) => {
            e.stopPropagation();
            onTagClick && onTagClick(tag);
          }}
          className={styles[variant]}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
};

export default TagList;