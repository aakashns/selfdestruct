function save_options() {
  var threshold = document.getElementById("threshold").value;
  chrome.storage.sync.set(
    {
      threshold: threshold
    },
    function() {
      var status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(function() {
        status.textContent = "";
      }, 1000);
    }
  );
}

function restore_options() {
  chrome.storage.sync.get(
    {
      threshold: 60
    },
    function(items) {
      document.getElementById("threshold").value = items.threshold;
    }
  );
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
