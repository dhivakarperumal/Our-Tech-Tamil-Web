import { useEffect } from "react";

function ScrollAnimations() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const observedElements = new WeakSet();
    const revealObserver = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("aos-animate");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0, rootMargin: "0px 0px -32px 0px" },
        )
      : null;

    const observePageContent = () => {
      root.querySelectorAll("main, .route-page-content").forEach((page) => {
        if (
          page.classList.contains("route-page-content") &&
          page.querySelector("main")
        ) {
          return;
        }

        const content = page.querySelectorAll(
          "section, article, form, [data-aos]",
        );
        const targets = content.length ? content : page.children;

        targets.forEach((element) => {
          if (observedElements.has(element)) return;
          observedElements.add(element);
          element.setAttribute("data-aos", element.getAttribute("data-aos") || "fade-up");

          if (revealObserver) {
            revealObserver.observe(element);
          } else {
            element.classList.add("aos-animate");
          }
        });
      });
    };

    observePageContent();
    const mutationObserver = new MutationObserver(observePageContent);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver?.disconnect();
    };
  }, []);

  return null;
}

export default ScrollAnimations;
