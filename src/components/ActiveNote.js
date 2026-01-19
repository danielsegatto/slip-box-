import React from 'react';

const ActiveNote = ({ content }) => (
  <article className="max-w-prose py-8 border-y border-transparent">
    <p className="text-2xl md:text-4xl text-center leading-relaxed text-[#1a1a1a] font-light">
      {content}
    </p>
  </article>
);

export default ActiveNote;
