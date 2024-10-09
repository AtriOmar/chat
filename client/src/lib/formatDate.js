export function formatDate(date, dateStyle = "date-time") {
  if (dateStyle === "date-time") {
    var intl = new Intl.DateTimeFormat("en-UK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } else if (dateStyle === "time") {
    var intl = new Intl.DateTimeFormat("en-UK", {
      timeStyle: "short",
    });
  } else if (dateStyle === "date") {
    var intl = new Intl.DateTimeFormat("en-UK", {
      dateStyle: "medium",
    });
  } else if (dateStyle === "day-month") {
    var intl = new Intl.DateTimeFormat("en-UK", {
      day: "numeric",
      month: "numeric",
    });
  }
  const formatted = intl?.format(new Date(date));
  return formatted;
}

export function formatDateRelative(date, dateStyle = "long") {
  const rtf = new Intl.RelativeTimeFormat("en-UK");
  const currTS = Date.now();
  const diff = currTS - new Date(date).getTime();
  const msToMin = 60000;
  const msToH = msToMin * 60;
  const msToD = msToH * 24;

  if (dateStyle === "long") {
    if (diff < msToMin) {
      return "Less than a minute ago";
    } else if (diff < 60 * msToMin) {
      return rtf.format(-Math.floor(diff / msToMin), "minute");
    } else if (diff < msToD) {
      return rtf.format(-Math.floor(diff / msToH), "hour");
    } else if (diff < 7 * msToD) {
      return rtf.format(-Math.floor(diff / msToD), "day");
    } else {
      return formatDate(date);
    }
  } else if (dateStyle === "short") {
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    if (diff < minute) {
      return "now";
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes}m`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours}h`;
    } else if (diff < month) {
      const days = Math.floor(diff / day);
      return `${days}d`;
    } else if (diff < year) {
      const months = Math.floor(diff / month);
      return `${months}mo`;
    } else {
      const years = Math.floor(diff / year);
      return `${years}y`;
    }
  }
}

export function formatRelativeTime(date, style = "long") {
  const now = new Date();
  try {
    var diff = now - new Date(date);
  } catch (err) {
    return null;
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (style === "long") {
    if (seconds < 60) {
      return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
    } else if (minutes < 60) {
      return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    } else if (hours < 24) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else if (days < 7) {
      return days === 1 ? "1 day ago" : `${days} days ago`;
    } else if (weeks < 4) {
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else if (months < 12) {
      return months === 1 ? "1 month ago" : `${months} months ago`;
    } else {
      return years === 1 ? "1 year ago" : `${years} years ago`;
    }
  } else if (style === "short") {
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    if (diff < minute) {
      return "now";
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes}m`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours}h`;
    } else if (diff < month) {
      const days = Math.floor(diff / day);
      return `${days}d`;
    } else if (diff < year) {
      const months = Math.floor(diff / month);
      return `${months}mo`;
    } else {
      const years = Math.floor(diff / year);
      return `${years}y`;
    }
  }
}

export function messageTime(messages, index) {
  const message = messages[index];
  const prevMessage = messages[index + 1];

  if (!prevMessage) return formatDate(message.createdAt, "date-time");

  if (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 600000) {
    return null;
  }

  if (new Date().getTime() - new Date(message.createdAt).getTime() > 1000 * 60 * 60 * 24 * 7) {
    return formatDate(message.createdAt, "date-time");
  }

  if (new Date().getTime() - new Date(message.createdAt).getTime() > 1000 * 60 * 60 * 24) {
    return formatDate(message.createdAt, "date");
  }

  return formatDate(message.createdAt, "time");
}
