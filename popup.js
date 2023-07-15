document.addEventListener('DOMContentLoaded', function() {
  populateFolderSelect();

  var openBookmarkButton = document.getElementById('openBookmarkButton');
  openBookmarkButton.addEventListener('click', function() {
    getRandomBookmark(function(bookmark) {
      if (bookmark) {
        browser.tabs.create({ url: bookmark.url });
      }
    });
  });
});

function getRandomBookmark(callback) {
  var includeSubfoldersCheckbox = document.getElementById('includeSubfoldersCheckbox');
  var includeSubfolders = includeSubfoldersCheckbox.checked;

  var folderSelect = document.getElementById('folderSelect');
  var selectedFolderId = folderSelect.value;
  
  browser.bookmarks.getSubTree(selectedFolderId, function(bookmarkTree) {
    var bookmarkFolder = bookmarkTree[0];
    var bookmarks = getAllBookmarks(bookmarkFolder, includeSubfolders);
    
    if (bookmarks.length > 0) {
      var randomIndex = Math.floor(Math.random() * bookmarks.length);
      var randomBookmark = bookmarks[randomIndex];
      callback(randomBookmark);
    } else {
      callback(null);
    }
  });
}

function getAllBookmarks(bookmarkNode, includeSubfolders) {
  function traverseBookmarks(bookmarkNode) {
    var bookmarks = [];

    if (bookmarkNode.type === 'bookmark') {
      bookmarks.push(bookmarkNode);
    }
    else if (bookmarkNode.type === 'folder' && bookmarkNode.children) {
      bookmarkNode.children.forEach(function(childNode) {
        if (childNode.type === 'folder' && includeSubfolders) {
          bookmarks.push(...traverseBookmarks(childNode));
        }
        else if (childNode.type === 'bookmark') {
          bookmarks.push(childNode);
        }
      });
    }

    return bookmarks;
  }

  return traverseBookmarks(bookmarkNode);
}

function populateFolderSelect() {
  var folderSelect = document.getElementById('folderSelect');
  folderSelect.addEventListener('change', function() {
    browser.storage.local.set({ 'selectedFolderId': folderSelect.value });
  });

  browser.bookmarks.getTree(function(bookmarkTree) {
    var rootNode = bookmarkTree[0];
    populateFolderOptions(rootNode, folderSelect);
  });

  browser.storage.local.get('selectedFolderId', function(result) {
    if (result.selectedFolderId) {
      folderSelect.value = result.selectedFolderId;
    }
  });
}

function populateFolderOptions(bookmarkNode, selectElement, indent = 0) {
  if (bookmarkNode.type === 'folder') {
    var option = document.createElement('option');
    option.value = bookmarkNode.id;
    option.text = '>'.repeat(indent) + ' ' + bookmarkNode.title;
    selectElement.appendChild(option);

    if (bookmarkNode.children) {
      for (var i = 0; i < bookmarkNode.children.length; i++) {
        populateFolderOptions(bookmarkNode.children[i], selectElement, indent + 1);
      }
    }
  }
}

function findBookmarkFolder(bookmarkNode, folderId) {
  if (bookmarkNode.id === folderId) {
    return bookmarkNode;
  }
  if (bookmarkNode.children) {
    for (var i = 0; i < bookmarkNode.children.length; i++) {
      var foundFolder = findBookmarkFolder(bookmarkNode.children[i], folderId);
      if (foundFolder) {
        return foundFolder;
      }
    }
  }
  return null;
}
